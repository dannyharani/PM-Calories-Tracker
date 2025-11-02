/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getUser = /* GraphQL */ `query GetUser($id: ID!) {
  getUser(id: $id) {
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
    owner
    __typename
  }
}
` as GeneratedQuery<APITypes.GetUserQueryVariables, APITypes.GetUserQuery>;
export const listUsers = /* GraphQL */ `query ListUsers(
  $filter: ModelUserFilterInput
  $limit: Int
  $nextToken: String
) {
  listUsers(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
      owner
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListUsersQueryVariables, APITypes.ListUsersQuery>;
export const getMeal = /* GraphQL */ `query GetMeal($id: ID!) {
  getMeal(id: $id) {
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
      owner
      __typename
    }
    createdAt
    updatedAt
    userMealsId
    owner
    __typename
  }
}
` as GeneratedQuery<APITypes.GetMealQueryVariables, APITypes.GetMealQuery>;
export const listMeals = /* GraphQL */ `query ListMeals(
  $filter: ModelMealFilterInput
  $limit: Int
  $nextToken: String
) {
  listMeals(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      date
      mealType
      calories
      estimatedIngredients
      createdAt
      updatedAt
      userMealsId
      owner
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListMealsQueryVariables, APITypes.ListMealsQuery>;
