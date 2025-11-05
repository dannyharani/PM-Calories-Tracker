/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createUser = /* GraphQL */ `mutation CreateUser(
  $input: CreateUserInput!
  $condition: ModelUserConditionInput
) {
  createUser(input: $input, condition: $condition) {
    id
    email
    firstName
    lastName
    dob
    gender
    height
    weight
    goal
    age
    goalDate
    calorieGoal
    meals {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateUserMutationVariables,
  APITypes.CreateUserMutation
>;
export const updateUser = /* GraphQL */ `mutation UpdateUser(
  $input: UpdateUserInput!
  $condition: ModelUserConditionInput
) {
  updateUser(input: $input, condition: $condition) {
    id
    email
    firstName
    lastName
    dob
    gender
    height
    weight
    goal
    age
    goalDate
    calorieGoal
    meals {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateUserMutationVariables,
  APITypes.UpdateUserMutation
>;
export const deleteUser = /* GraphQL */ `mutation DeleteUser(
  $input: DeleteUserInput!
  $condition: ModelUserConditionInput
) {
  deleteUser(input: $input, condition: $condition) {
    id
    email
    firstName
    lastName
    dob
    gender
    height
    weight
    goal
    age
    goalDate
    calorieGoal
    meals {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteUserMutationVariables,
  APITypes.DeleteUserMutation
>;
export const createMeal = /* GraphQL */ `mutation CreateMeal(
  $input: CreateMealInput!
  $condition: ModelMealConditionInput
) {
  createMeal(input: $input, condition: $condition) {
    id
    date
    mealType
    calories
    estimatedIngredients
    user {
      id
      email
      firstName
      lastName
      dob
      gender
      height
      weight
      goal
      age
      goalDate
      calorieGoal
      createdAt
      updatedAt
      __typename
    }
    dateTime
    createdAt
    updatedAt
    userMealsId
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateMealMutationVariables,
  APITypes.CreateMealMutation
>;
export const updateMeal = /* GraphQL */ `mutation UpdateMeal(
  $input: UpdateMealInput!
  $condition: ModelMealConditionInput
) {
  updateMeal(input: $input, condition: $condition) {
    id
    date
    mealType
    calories
    estimatedIngredients
    user {
      id
      email
      firstName
      lastName
      dob
      gender
      height
      weight
      goal
      age
      goalDate
      calorieGoal
      createdAt
      updatedAt
      __typename
    }
    dateTime
    createdAt
    updatedAt
    userMealsId
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateMealMutationVariables,
  APITypes.UpdateMealMutation
>;
export const deleteMeal = /* GraphQL */ `mutation DeleteMeal(
  $input: DeleteMealInput!
  $condition: ModelMealConditionInput
) {
  deleteMeal(input: $input, condition: $condition) {
    id
    date
    mealType
    calories
    estimatedIngredients
    user {
      id
      email
      firstName
      lastName
      dob
      gender
      height
      weight
      goal
      age
      goalDate
      calorieGoal
      createdAt
      updatedAt
      __typename
    }
    dateTime
    createdAt
    updatedAt
    userMealsId
    owner
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteMealMutationVariables,
  APITypes.DeleteMealMutation
>;
