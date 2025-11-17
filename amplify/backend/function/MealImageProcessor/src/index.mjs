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
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
export const handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);

    for (const record of event.Records) {
        const bucket = record.s3.bucket.name;
        const key = record.s3.object.key;

        const keyParts = key.split("/");
        const fileName = keyParts[keyParts.length - 1];
        const mealId = fileName.split(".")[0];

        if (!mealId) {
            console.error(`Could not parse mealId from key: ${key}`);
            continue;
        }

        try {
            const nutritionalData = await callAIModel(bucket, key);
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
                    status: "COMPLETE",
                },
            };

            const response = await appSyncRequest(mutation, variables);
            console.log(response);
        } catch (error) {
            console.log(error);
            /* can handle error */ await appSyncRequest(
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

async function callAIModel(bucket, key) {
    console.warn("Calling ai model. getting bucket");

    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    let base64String;

    try {
        console.warn("Trying bucket");
        const response = await s3Client.send(command);
        console.warn("Bucket succeeded");
        base64String = await response.Body.transformToString('base64')
        console.warn("Readable stream succeeded");
    } catch (err) {
        console.error("Response from s3 client failed: ", err);
        throw err;
    }

    const systemPrompt = `You are a nutritional expert. Analyze the provided image of a meal and return ONLY a single, valid JSON object with the following structure:
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

    const invokeCommand = new InvokeModelCommand({
        modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(payload),
    });

    const response = await bedrockClient.send(invokeCommand);

    console.warn("Invoke succeeded");

    const responseBody = new TextDecoder().decode(response.body);
    const parsedResponseBody = JSON.parse(responseBody);

    const aiResponseText = parsedResponseBody.content[0].text;
    const nutritionalData = JSON.parse(aiResponseText);

    if (typeof nutritionalData.calories !== "number") {
        throw new Error("AI response was not valid JSON with calories.");
    }

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

async function appSyncRequest(query, variables) {
    const endpoint = new URL(GRAPHQL_ENDPOINT);

    const signer = new SignatureV4({
        credentials: defaultProvider(),
        region: AWS_REGION,
        service: "appsync",
        sha256: Sha256,
    });

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

    const signed = await signer.sign(requestToBeSigned);
    const request = new Request(GRAPHQL_ENDPOINT, signed);

    let statusCode = 200;
    let body;
    let response;

    try {
        response = await fetch(request);
        body = await response.json();
        if (body.errors) statusCode = 400;
    } catch (err) {
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
