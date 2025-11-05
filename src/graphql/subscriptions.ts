/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateUser = /* GraphQL */ `subscription OnCreateUser(
  $filter: ModelSubscriptionUserFilterInput
  $id: String
) {
  onCreateUser(filter: $filter, id: $id) {
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
` as GeneratedSubscription<
  APITypes.OnCreateUserSubscriptionVariables,
  APITypes.OnCreateUserSubscription
>;
export const onUpdateUser = /* GraphQL */ `subscription OnUpdateUser(
  $filter: ModelSubscriptionUserFilterInput
  $id: String
) {
  onUpdateUser(filter: $filter, id: $id) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateUserSubscriptionVariables,
  APITypes.OnUpdateUserSubscription
>;
export const onDeleteUser = /* GraphQL */ `subscription OnDeleteUser(
  $filter: ModelSubscriptionUserFilterInput
  $id: String
) {
  onDeleteUser(filter: $filter, id: $id) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteUserSubscriptionVariables,
  APITypes.OnDeleteUserSubscription
>;
export const onCreateMeal = /* GraphQL */ `subscription OnCreateMeal(
  $filter: ModelSubscriptionMealFilterInput
  $owner: String
) {
  onCreateMeal(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateMealSubscriptionVariables,
  APITypes.OnCreateMealSubscription
>;
export const onUpdateMeal = /* GraphQL */ `subscription OnUpdateMeal(
  $filter: ModelSubscriptionMealFilterInput
  $owner: String
) {
  onUpdateMeal(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateMealSubscriptionVariables,
  APITypes.OnUpdateMealSubscription
>;
export const onDeleteMeal = /* GraphQL */ `subscription OnDeleteMeal(
  $filter: ModelSubscriptionMealFilterInput
  $owner: String
) {
  onDeleteMeal(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteMealSubscriptionVariables,
  APITypes.OnDeleteMealSubscription
>;
