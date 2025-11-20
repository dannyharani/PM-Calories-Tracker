/* Amplify Params - DO NOT EDIT
    API_SEG4105_GRAPHQLAPIENDPOINTOUTPUT
    API_SEG4105_GRAPHQLAPIIDOUTPUT
    API_SEG4105_GRAPHQLAPIKEYOUTPUT
    ENV
    REGION
Amplify Params - DO NOT EDIT */

import crypto from "@aws-crypto/sha256-js";
import {
    BedrockRuntimeClient,
    InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { default as fetch, Request } from "node-fetch";

const GRAPHQL_ENDPOINT = process.env.API_SEG4105_GRAPHQLAPIENDPOINTOUTPUT;
const GRAPHQL_API_KEY = process.env.API_SEG4105_GRAPHQLAPIKEYOUTPUT;
const { Sha256 } = crypto;
const AWS_REGION = process.env.AWS_REGION || "us-east-1";

const s3Client = new S3Client({ region: AWS_REGION });
const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });

/**
 * Lambda handler function triggered by S3 events when meal images are uploaded.
 * Processes each uploaded image through AI analysis to extract nutritional information,
 * then updates the corresponding meal record in the database via GraphQL.
 * 
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 * @param {Object} event - S3 event containing records of uploaded files
 * @param {Array} event.Records - Array of S3 event records
 * @returns {Promise<Object>} Response with statusCode and body
 * 
 * Flow:
 * 1. Parse S3 event to extract bucket name and object key
 * 2. Extract meal ID from filename (format: {mealId}.{extension})
 * 3. Call AI model to analyze the meal image
 * 4. Update meal record with nutritional data via GraphQL mutation
 * 5. On error, mark meal status as ERROR in database
 */
export const handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);

    // Process each S3 record (typically one per invocation)
    for (const record of event.Records) {
        const bucket = record.s3.bucket.name;
        const key = record.s3.object.key;

        // Extract meal ID from the S3 object key
        // Expected format: public/uploads/{mealId}.{extension}
        const keyParts = key.split("/");
        const fileName = keyParts[keyParts.length - 1];
        const mealId = fileName.split(".")[0];

        if (!mealId) {
            console.error(`Could not parse mealId from key: ${key}`);
            continue;
        }

        try {
            // Analyze the meal image using AI to extract nutritional information
            const nutritionalData = await callAIModel(bucket, key);

            // GraphQL mutation to update the meal with AI-analyzed nutritional data
            const mutation = `mutation UpdateMeal($input: UpdateMealInput!) {
                updateMeal(input: $input) {
                    mealName
                    mealType
                    id
                    status
                    calories
                    proteinGrams
                    carbsGrams
                    fatGrams
                    estimatedIngredients
                    estimateConfidence
                }
            }`;

            const variables = {
                input: {
                    id: mealId,
                    ...nutritionalData,
                    status: "COMPLETE", // Mark as complete after successful AI analysis
                },
            };

            const response = await appSyncRequest(mutation, variables);
            console.log(response);
        } catch (error) {
            console.log(error);
            // On error, update meal status to ERROR so the UI can display appropriate message
            await appSyncRequest(
                `
                mutation UpdateMealStatus($input: UpdateMealInput!) {
                    updateMeal(input: $input) { id status }
                }
                `,
                {
                    input: { id: mealId, status: "ERROR" },
                }
            );
        }
    }
    return {
        statusCode: 200,
        body: JSON.stringify("Processing complete."),
    };
};

/**
 * Analyzes a meal image using AWS Bedrock AI (Claude 3 Haiku) to extract nutritional information.
 * 
 * @param {string} bucket - S3 bucket name containing the meal image
 * @param {string} key - S3 object key (path) to the meal image
 * @returns {Promise<Object>} Nutritional data object containing:
 *   - mealName: string - Name of the meal (e.g., "Cheeseburger")
 *   - mealType: string - Type of meal (BREAKFAST, LUNCH, DINNER, SNACK)
 *   - calories: number - Estimated calorie count
 *   - proteinGrams: number - Protein content in grams
 *   - carbsGrams: number - Carbohydrate content in grams
 *   - fatGrams: number - Fat content in grams
 *   - estimatedIngredients: string[] - List of ingredient names
 *   - estimateConfidence: number - Confidence score (0.0 to 1.0)
 * 
 * @throws {Error} If S3 retrieval fails, AI invocation fails, or response is invalid
 * 
 * Process:
 * 1. Retrieve image from S3 bucket
 * 2. Convert image to base64 string
 * 3. Send image to Claude AI with structured prompt
 * 4. Parse JSON response from AI
 * 5. Validate and return nutritional data
 */
async function callAIModel(bucket, key) {
    console.warn("Calling ai model. getting bucket");

    // Prepare S3 GetObject command to retrieve the meal image
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    let base64String;

    try {
        console.warn("Trying bucket");
        const response = await s3Client.send(command);
        console.warn("Bucket succeeded");

        // Convert the S3 response body stream to base64 for AI model input
        base64String = await response.Body.transformToString('base64')
        console.warn("Readable stream succeeded");
    } catch (err) {
        console.error("Response from s3 client failed: ", err);
        throw err;
    }

    // System prompt instructs the AI to analyze the meal image and return structured JSON
    // Important: Assumes visible portion IS the full portion (no assumptions about serving size)
    const systemPrompt = `You are a nutritional expert. Analyze the provided image of a meal, making no assumption of portion size (the visible item *is* the portion), and return ONLY a single, valid JSON object with the following structure:
  {
    "mealName": <string>, // e.g. Cheeseburger
    "mealType": <"LUNCH" | "DINNER" | "BREAKFAST" | "SNACK">
    "calories": <number>,
    "proteinGrams": <number>,
    "carbsGrams": <number>,
    "fatGrams": <number>,
    "estimatedIngredients": [<string>], // a list of the ingredient names
    "estimateConfidence": <number from 0.0 to 1.0>
  }
  Do not add any text, explanations, or markdown formatting (like \`\`\`json) before or after the JSON object.`;

    // Use Claude 3 Haiku model for fast, cost-effective nutritional analysis
    const modelId = "anthropic.claude-3-haiku-20240307-v1:0";
    const payload = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "image",
                        source: {
                            type: "base64",
                            media_type: "image/jpeg",
                            data: base64String,
                        },
                    },
                    {
                        type: "text",
                        text: "Please analyze this meal and provide the nutritional JSON.",
                    },
                ],
            },
        ],
    };

    console.warn("Invoke attempt");

    // Invoke the Bedrock AI model with the meal image and prompt
    const invokeCommand = new InvokeModelCommand({
        modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(payload),
    });

    const response = await bedrockClient.send(invokeCommand);

    console.warn("Invoke succeeded");

    // Parse the AI response to extract nutritional data
    const responseBody = new TextDecoder().decode(response.body);
    const parsedResponseBody = JSON.parse(responseBody);

    // Extract the text content from the AI response (contains JSON string)
    const aiResponseText = parsedResponseBody.content[0].text;
    const nutritionalData = JSON.parse(aiResponseText);

    // Validate that the AI returned valid nutritional data with at least calories
    if (typeof nutritionalData.calories !== "number") {
        throw new Error("AI response was not valid JSON with calories.");
    }

    // Return only the fields we need for the meal record
    return {
        mealName: nutritionalData.mealName,
        mealType: nutritionalData.mealType,
        calories: nutritionalData.calories,
        proteinGrams: nutritionalData.proteinGrams,
        carbsGrams: nutritionalData.carbsGrams,
        fatGrams: nutritionalData.fatGrams,
        estimatedIngredients: nutritionalData.estimatedIngredients,
        estimateConfidence: nutritionalData.estimateConfidence,
    };
}

/**
 * Executes a GraphQL mutation or query against AWS AppSync with IAM authentication.
 * Uses AWS Signature V4 to sign the request for secure access.
 * 
 * @param {string} query - GraphQL query or mutation string
 * @param {Object} variables - Variables object for the GraphQL operation
 * @returns {Promise<Object>} Response object with statusCode and body
 * 
 * Authentication:
 * - Uses AWS Signature V4 signing process
 * - Credentials obtained from default provider (Lambda execution role)
 * - Signed request ensures secure access to AppSync API
 * 
 * Error Handling:
 * - Returns statusCode 400 if GraphQL errors are present
 * - Catches and returns fetch errors with stack trace
 */
async function appSyncRequest(query, variables) {
    const endpoint = new URL(GRAPHQL_ENDPOINT);

    // Create a signer using AWS Signature V4 for AppSync authentication
    const signer = new SignatureV4({
        credentials: defaultProvider(), // Uses Lambda execution role credentials
        region: AWS_REGION,
        service: "appsync",
        sha256: Sha256,
    });

    // Prepare the HTTP request with GraphQL query and variables
    const requestToBeSigned = new HttpRequest({
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            host: endpoint.host,
        },
        hostname: endpoint.host,
        body: JSON.stringify({ query, variables }),
        path: endpoint.pathname,
    });

    // Sign the request using AWS Signature V4
    const signed = await signer.sign(requestToBeSigned);
    const request = new Request(GRAPHQL_ENDPOINT, signed);

    let statusCode = 200;
    let body;
    let response;

    try {
        // Execute the signed GraphQL request
        response = await fetch(request);
        body = await response.json();

        // Check for GraphQL errors in the response
        if (body.errors) statusCode = 400;
    } catch (err) {
        // Handle network or parsing errors
        statusCode = 400;
        body = {
            status: response.status,
            message: err.message,
            stack: err.stack,
        };
    }

    return {
        statusCode,
        body: JSON.stringify(body),
    };
}
