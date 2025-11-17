/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreateUserInput = {
  id?: string | null,
  email: string,
  firstName?: string | null,
  lastName?: string | null,
  dob?: string | null,
  gender?: string | null,
  height?: number | null,
  weight?: number | null,
  goal?: Goal | null,
  age?: number | null,
  goalDate?: string | null,
  calorieGoal?: number | null,
};

export enum Goal {
  LOSE_WEIGHT = "LOSE_WEIGHT",
  MAINTAIN_WEIGHT = "MAINTAIN_WEIGHT",
  GAIN_WEIGHT = "GAIN_WEIGHT",
  BUILD_MUSCLE = "BUILD_MUSCLE",
  LOSE_FAT = "LOSE_FAT",
}


export type ModelUserConditionInput = {
  email?: ModelStringInput | null,
  firstName?: ModelStringInput | null,
  lastName?: ModelStringInput | null,
  dob?: ModelStringInput | null,
  gender?: ModelStringInput | null,
  height?: ModelFloatInput | null,
  weight?: ModelFloatInput | null,
  goal?: ModelGoalInput | null,
  age?: ModelIntInput | null,
  goalDate?: ModelStringInput | null,
  calorieGoal?: ModelIntInput | null,
  and?: Array< ModelUserConditionInput | null > | null,
  or?: Array< ModelUserConditionInput | null > | null,
  not?: ModelUserConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  id?: ModelStringInput | null,
};

export type ModelStringInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export enum ModelAttributeTypes {
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
  _null = "_null",
}


export type ModelSizeInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
};

export type ModelFloatInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
};

export type ModelGoalInput = {
  eq?: Goal | null,
  ne?: Goal | null,
};

export type ModelIntInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
};

export type User = {
  __typename: "User",
  id: string,
  email: string,
  firstName?: string | null,
  lastName?: string | null,
  dob?: string | null,
  gender?: string | null,
  height?: number | null,
  weight?: number | null,
  goal?: Goal | null,
  age?: number | null,
  goalDate?: string | null,
  calorieGoal?: number | null,
  meals?: ModelMealConnection | null,
  createdAt: string,
  updatedAt: string,
};

export type ModelMealConnection = {
  __typename: "ModelMealConnection",
  items:  Array<Meal | null >,
  nextToken?: string | null,
};

export type Meal = {
  __typename: "Meal",
  id: string,
  date: string,
  mealType: MealType,
  estimatedIngredients?: Array< string | null > | null,
  mealName?: string | null,
  calories?: number | null,
  proteinGrams?: number | null,
  carbsGrams?: number | null,
  fatGrams?: number | null,
  user_estimated_calories?: number | null,
  user_estimated_proteinGrams?: number | null,
  user_estimated_carbsGrams?: number | null,
  user_estimated_fatGrams?: number | null,
  photoKey?: string | null,
  estimateConfidence?: number | null,
  user?: User | null,
  status?: StatusType | null,
  createdAt: string,
  updatedAt: string,
  userMealsId?: string | null,
  owner?: string | null,
};

export enum MealType {
  BREAKFAST = "BREAKFAST",
  LUNCH = "LUNCH",
  DINNER = "DINNER",
  SNACK = "SNACK",
}


export enum StatusType {
  PROCESSING = "PROCESSING",
  COMPLETE = "COMPLETE",
  MANUAL = "MANUAL",
  ERROR = "ERROR",
}


export type UpdateUserInput = {
  id: string,
  email?: string | null,
  firstName?: string | null,
  lastName?: string | null,
  dob?: string | null,
  gender?: string | null,
  height?: number | null,
  weight?: number | null,
  goal?: Goal | null,
  age?: number | null,
  goalDate?: string | null,
  calorieGoal?: number | null,
};

export type DeleteUserInput = {
  id: string,
};

export type CreateMealInput = {
  id?: string | null,
  date: string,
  mealType: MealType,
  estimatedIngredients?: Array< string | null > | null,
  mealName?: string | null,
  calories?: number | null,
  proteinGrams?: number | null,
  carbsGrams?: number | null,
  fatGrams?: number | null,
  user_estimated_calories?: number | null,
  user_estimated_proteinGrams?: number | null,
  user_estimated_carbsGrams?: number | null,
  user_estimated_fatGrams?: number | null,
  photoKey?: string | null,
  estimateConfidence?: number | null,
  status?: StatusType | null,
  userMealsId?: string | null,
};

export type ModelMealConditionInput = {
  date?: ModelStringInput | null,
  mealType?: ModelMealTypeInput | null,
  estimatedIngredients?: ModelStringInput | null,
  mealName?: ModelStringInput | null,
  calories?: ModelIntInput | null,
  proteinGrams?: ModelFloatInput | null,
  carbsGrams?: ModelFloatInput | null,
  fatGrams?: ModelFloatInput | null,
  user_estimated_calories?: ModelIntInput | null,
  user_estimated_proteinGrams?: ModelFloatInput | null,
  user_estimated_carbsGrams?: ModelFloatInput | null,
  user_estimated_fatGrams?: ModelFloatInput | null,
  photoKey?: ModelStringInput | null,
  estimateConfidence?: ModelFloatInput | null,
  status?: ModelStatusTypeInput | null,
  and?: Array< ModelMealConditionInput | null > | null,
  or?: Array< ModelMealConditionInput | null > | null,
  not?: ModelMealConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  userMealsId?: ModelIDInput | null,
  owner?: ModelStringInput | null,
};

export type ModelMealTypeInput = {
  eq?: MealType | null,
  ne?: MealType | null,
};

export type ModelStatusTypeInput = {
  eq?: StatusType | null,
  ne?: StatusType | null,
};

export type ModelIDInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export type UpdateMealInput = {
  id: string,
  date?: string | null,
  mealType?: MealType | null,
  estimatedIngredients?: Array< string | null > | null,
  mealName?: string | null,
  calories?: number | null,
  proteinGrams?: number | null,
  carbsGrams?: number | null,
  fatGrams?: number | null,
  user_estimated_calories?: number | null,
  user_estimated_proteinGrams?: number | null,
  user_estimated_carbsGrams?: number | null,
  user_estimated_fatGrams?: number | null,
  photoKey?: string | null,
  estimateConfidence?: number | null,
  status?: StatusType | null,
  userMealsId?: string | null,
};

export type DeleteMealInput = {
  id: string,
};

export type ModelUserFilterInput = {
  id?: ModelIDInput | null,
  email?: ModelStringInput | null,
  firstName?: ModelStringInput | null,
  lastName?: ModelStringInput | null,
  dob?: ModelStringInput | null,
  gender?: ModelStringInput | null,
  height?: ModelFloatInput | null,
  weight?: ModelFloatInput | null,
  goal?: ModelGoalInput | null,
  age?: ModelIntInput | null,
  goalDate?: ModelStringInput | null,
  calorieGoal?: ModelIntInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelUserFilterInput | null > | null,
  or?: Array< ModelUserFilterInput | null > | null,
  not?: ModelUserFilterInput | null,
};

export type ModelUserConnection = {
  __typename: "ModelUserConnection",
  items:  Array<User | null >,
  nextToken?: string | null,
};

export type ModelMealFilterInput = {
  id?: ModelIDInput | null,
  date?: ModelStringInput | null,
  mealType?: ModelMealTypeInput | null,
  estimatedIngredients?: ModelStringInput | null,
  mealName?: ModelStringInput | null,
  calories?: ModelIntInput | null,
  proteinGrams?: ModelFloatInput | null,
  carbsGrams?: ModelFloatInput | null,
  fatGrams?: ModelFloatInput | null,
  user_estimated_calories?: ModelIntInput | null,
  user_estimated_proteinGrams?: ModelFloatInput | null,
  user_estimated_carbsGrams?: ModelFloatInput | null,
  user_estimated_fatGrams?: ModelFloatInput | null,
  photoKey?: ModelStringInput | null,
  estimateConfidence?: ModelFloatInput | null,
  status?: ModelStatusTypeInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelMealFilterInput | null > | null,
  or?: Array< ModelMealFilterInput | null > | null,
  not?: ModelMealFilterInput | null,
  userMealsId?: ModelIDInput | null,
  owner?: ModelStringInput | null,
};

export type ModelSubscriptionUserFilterInput = {
  email?: ModelSubscriptionStringInput | null,
  firstName?: ModelSubscriptionStringInput | null,
  lastName?: ModelSubscriptionStringInput | null,
  dob?: ModelSubscriptionStringInput | null,
  gender?: ModelSubscriptionStringInput | null,
  height?: ModelSubscriptionFloatInput | null,
  weight?: ModelSubscriptionFloatInput | null,
  goal?: ModelSubscriptionStringInput | null,
  age?: ModelSubscriptionIntInput | null,
  goalDate?: ModelSubscriptionStringInput | null,
  calorieGoal?: ModelSubscriptionIntInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionUserFilterInput | null > | null,
  or?: Array< ModelSubscriptionUserFilterInput | null > | null,
  userMealsId?: ModelSubscriptionIDInput | null,
  id?: ModelStringInput | null,
};

export type ModelSubscriptionStringInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  in?: Array< string | null > | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionFloatInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  in?: Array< number | null > | null,
  notIn?: Array< number | null > | null,
};

export type ModelSubscriptionIntInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  in?: Array< number | null > | null,
  notIn?: Array< number | null > | null,
};

export type ModelSubscriptionIDInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  in?: Array< string | null > | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionMealFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  date?: ModelSubscriptionStringInput | null,
  mealType?: ModelSubscriptionStringInput | null,
  estimatedIngredients?: ModelSubscriptionStringInput | null,
  mealName?: ModelSubscriptionStringInput | null,
  calories?: ModelSubscriptionIntInput | null,
  proteinGrams?: ModelSubscriptionFloatInput | null,
  carbsGrams?: ModelSubscriptionFloatInput | null,
  fatGrams?: ModelSubscriptionFloatInput | null,
  user_estimated_calories?: ModelSubscriptionIntInput | null,
  user_estimated_proteinGrams?: ModelSubscriptionFloatInput | null,
  user_estimated_carbsGrams?: ModelSubscriptionFloatInput | null,
  user_estimated_fatGrams?: ModelSubscriptionFloatInput | null,
  photoKey?: ModelSubscriptionStringInput | null,
  estimateConfidence?: ModelSubscriptionFloatInput | null,
  status?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionMealFilterInput | null > | null,
  or?: Array< ModelSubscriptionMealFilterInput | null > | null,
  owner?: ModelStringInput | null,
};

export type CreateUserMutationVariables = {
  input: CreateUserInput,
  condition?: ModelUserConditionInput | null,
};

export type CreateUserMutation = {
  createUser?:  {
    __typename: "User",
    id: string,
    email: string,
    firstName?: string | null,
    lastName?: string | null,
    dob?: string | null,
    gender?: string | null,
    height?: number | null,
    weight?: number | null,
    goal?: Goal | null,
    age?: number | null,
    goalDate?: string | null,
    calorieGoal?: number | null,
    meals?:  {
      __typename: "ModelMealConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateUserMutationVariables = {
  input: UpdateUserInput,
  condition?: ModelUserConditionInput | null,
};

export type UpdateUserMutation = {
  updateUser?:  {
    __typename: "User",
    id: string,
    email: string,
    firstName?: string | null,
    lastName?: string | null,
    dob?: string | null,
    gender?: string | null,
    height?: number | null,
    weight?: number | null,
    goal?: Goal | null,
    age?: number | null,
    goalDate?: string | null,
    calorieGoal?: number | null,
    meals?:  {
      __typename: "ModelMealConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteUserMutationVariables = {
  input: DeleteUserInput,
  condition?: ModelUserConditionInput | null,
};

export type DeleteUserMutation = {
  deleteUser?:  {
    __typename: "User",
    id: string,
    email: string,
    firstName?: string | null,
    lastName?: string | null,
    dob?: string | null,
    gender?: string | null,
    height?: number | null,
    weight?: number | null,
    goal?: Goal | null,
    age?: number | null,
    goalDate?: string | null,
    calorieGoal?: number | null,
    meals?:  {
      __typename: "ModelMealConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateMealMutationVariables = {
  input: CreateMealInput,
  condition?: ModelMealConditionInput | null,
};

export type CreateMealMutation = {
  createMeal?:  {
    __typename: "Meal",
    id: string,
    date: string,
    mealType: MealType,
    estimatedIngredients?: Array< string | null > | null,
    mealName?: string | null,
    calories?: number | null,
    proteinGrams?: number | null,
    carbsGrams?: number | null,
    fatGrams?: number | null,
    user_estimated_calories?: number | null,
    user_estimated_proteinGrams?: number | null,
    user_estimated_carbsGrams?: number | null,
    user_estimated_fatGrams?: number | null,
    photoKey?: string | null,
    estimateConfidence?: number | null,
    user?:  {
      __typename: "User",
      id: string,
      email: string,
      firstName?: string | null,
      lastName?: string | null,
      dob?: string | null,
      gender?: string | null,
      height?: number | null,
      weight?: number | null,
      goal?: Goal | null,
      age?: number | null,
      goalDate?: string | null,
      calorieGoal?: number | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    status?: StatusType | null,
    createdAt: string,
    updatedAt: string,
    userMealsId?: string | null,
    owner?: string | null,
  } | null,
};

export type UpdateMealMutationVariables = {
  input: UpdateMealInput,
  condition?: ModelMealConditionInput | null,
};

export type UpdateMealMutation = {
  updateMeal?:  {
    __typename: "Meal",
    id: string,
    date: string,
    mealType: MealType,
    estimatedIngredients?: Array< string | null > | null,
    mealName?: string | null,
    calories?: number | null,
    proteinGrams?: number | null,
    carbsGrams?: number | null,
    fatGrams?: number | null,
    user_estimated_calories?: number | null,
    user_estimated_proteinGrams?: number | null,
    user_estimated_carbsGrams?: number | null,
    user_estimated_fatGrams?: number | null,
    photoKey?: string | null,
    estimateConfidence?: number | null,
    user?:  {
      __typename: "User",
      id: string,
      email: string,
      firstName?: string | null,
      lastName?: string | null,
      dob?: string | null,
      gender?: string | null,
      height?: number | null,
      weight?: number | null,
      goal?: Goal | null,
      age?: number | null,
      goalDate?: string | null,
      calorieGoal?: number | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    status?: StatusType | null,
    createdAt: string,
    updatedAt: string,
    userMealsId?: string | null,
    owner?: string | null,
  } | null,
};

export type DeleteMealMutationVariables = {
  input: DeleteMealInput,
  condition?: ModelMealConditionInput | null,
};

export type DeleteMealMutation = {
  deleteMeal?:  {
    __typename: "Meal",
    id: string,
    date: string,
    mealType: MealType,
    estimatedIngredients?: Array< string | null > | null,
    mealName?: string | null,
    calories?: number | null,
    proteinGrams?: number | null,
    carbsGrams?: number | null,
    fatGrams?: number | null,
    user_estimated_calories?: number | null,
    user_estimated_proteinGrams?: number | null,
    user_estimated_carbsGrams?: number | null,
    user_estimated_fatGrams?: number | null,
    photoKey?: string | null,
    estimateConfidence?: number | null,
    user?:  {
      __typename: "User",
      id: string,
      email: string,
      firstName?: string | null,
      lastName?: string | null,
      dob?: string | null,
      gender?: string | null,
      height?: number | null,
      weight?: number | null,
      goal?: Goal | null,
      age?: number | null,
      goalDate?: string | null,
      calorieGoal?: number | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    status?: StatusType | null,
    createdAt: string,
    updatedAt: string,
    userMealsId?: string | null,
    owner?: string | null,
  } | null,
};

export type GetUserQueryVariables = {
  id: string,
};

export type GetUserQuery = {
  getUser?:  {
    __typename: "User",
    id: string,
    email: string,
    firstName?: string | null,
    lastName?: string | null,
    dob?: string | null,
    gender?: string | null,
    height?: number | null,
    weight?: number | null,
    goal?: Goal | null,
    age?: number | null,
    goalDate?: string | null,
    calorieGoal?: number | null,
    meals?:  {
      __typename: "ModelMealConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListUsersQueryVariables = {
  filter?: ModelUserFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUsersQuery = {
  listUsers?:  {
    __typename: "ModelUserConnection",
    items:  Array< {
      __typename: "User",
      id: string,
      email: string,
      firstName?: string | null,
      lastName?: string | null,
      dob?: string | null,
      gender?: string | null,
      height?: number | null,
      weight?: number | null,
      goal?: Goal | null,
      age?: number | null,
      goalDate?: string | null,
      calorieGoal?: number | null,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetMealQueryVariables = {
  id: string,
};

export type GetMealQuery = {
  getMeal?:  {
    __typename: "Meal",
    id: string,
    date: string,
    mealType: MealType,
    estimatedIngredients?: Array< string | null > | null,
    mealName?: string | null,
    calories?: number | null,
    proteinGrams?: number | null,
    carbsGrams?: number | null,
    fatGrams?: number | null,
    user_estimated_calories?: number | null,
    user_estimated_proteinGrams?: number | null,
    user_estimated_carbsGrams?: number | null,
    user_estimated_fatGrams?: number | null,
    photoKey?: string | null,
    estimateConfidence?: number | null,
    user?:  {
      __typename: "User",
      id: string,
      email: string,
      firstName?: string | null,
      lastName?: string | null,
      dob?: string | null,
      gender?: string | null,
      height?: number | null,
      weight?: number | null,
      goal?: Goal | null,
      age?: number | null,
      goalDate?: string | null,
      calorieGoal?: number | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    status?: StatusType | null,
    createdAt: string,
    updatedAt: string,
    userMealsId?: string | null,
    owner?: string | null,
  } | null,
};

export type ListMealsQueryVariables = {
  filter?: ModelMealFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListMealsQuery = {
  listMeals?:  {
    __typename: "ModelMealConnection",
    items:  Array< {
      __typename: "Meal",
      id: string,
      date: string,
      mealType: MealType,
      estimatedIngredients?: Array< string | null > | null,
      mealName?: string | null,
      calories?: number | null,
      proteinGrams?: number | null,
      carbsGrams?: number | null,
      fatGrams?: number | null,
      user_estimated_calories?: number | null,
      user_estimated_proteinGrams?: number | null,
      user_estimated_carbsGrams?: number | null,
      user_estimated_fatGrams?: number | null,
      photoKey?: string | null,
      estimateConfidence?: number | null,
      status?: StatusType | null,
      createdAt: string,
      updatedAt: string,
      userMealsId?: string | null,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type OnCreateUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
  id?: string | null,
};

export type OnCreateUserSubscription = {
  onCreateUser?:  {
    __typename: "User",
    id: string,
    email: string,
    firstName?: string | null,
    lastName?: string | null,
    dob?: string | null,
    gender?: string | null,
    height?: number | null,
    weight?: number | null,
    goal?: Goal | null,
    age?: number | null,
    goalDate?: string | null,
    calorieGoal?: number | null,
    meals?:  {
      __typename: "ModelMealConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
  id?: string | null,
};

export type OnUpdateUserSubscription = {
  onUpdateUser?:  {
    __typename: "User",
    id: string,
    email: string,
    firstName?: string | null,
    lastName?: string | null,
    dob?: string | null,
    gender?: string | null,
    height?: number | null,
    weight?: number | null,
    goal?: Goal | null,
    age?: number | null,
    goalDate?: string | null,
    calorieGoal?: number | null,
    meals?:  {
      __typename: "ModelMealConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
  id?: string | null,
};

export type OnDeleteUserSubscription = {
  onDeleteUser?:  {
    __typename: "User",
    id: string,
    email: string,
    firstName?: string | null,
    lastName?: string | null,
    dob?: string | null,
    gender?: string | null,
    height?: number | null,
    weight?: number | null,
    goal?: Goal | null,
    age?: number | null,
    goalDate?: string | null,
    calorieGoal?: number | null,
    meals?:  {
      __typename: "ModelMealConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateMealSubscriptionVariables = {
  filter?: ModelSubscriptionMealFilterInput | null,
  owner?: string | null,
};

export type OnCreateMealSubscription = {
  onCreateMeal?:  {
    __typename: "Meal",
    id: string,
    date: string,
    mealType: MealType,
    estimatedIngredients?: Array< string | null > | null,
    mealName?: string | null,
    calories?: number | null,
    proteinGrams?: number | null,
    carbsGrams?: number | null,
    fatGrams?: number | null,
    user_estimated_calories?: number | null,
    user_estimated_proteinGrams?: number | null,
    user_estimated_carbsGrams?: number | null,
    user_estimated_fatGrams?: number | null,
    photoKey?: string | null,
    estimateConfidence?: number | null,
    user?:  {
      __typename: "User",
      id: string,
      email: string,
      firstName?: string | null,
      lastName?: string | null,
      dob?: string | null,
      gender?: string | null,
      height?: number | null,
      weight?: number | null,
      goal?: Goal | null,
      age?: number | null,
      goalDate?: string | null,
      calorieGoal?: number | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    status?: StatusType | null,
    createdAt: string,
    updatedAt: string,
    userMealsId?: string | null,
    owner?: string | null,
  } | null,
};

export type OnUpdateMealSubscriptionVariables = {
  filter?: ModelSubscriptionMealFilterInput | null,
  owner?: string | null,
};

export type OnUpdateMealSubscription = {
  onUpdateMeal?:  {
    __typename: "Meal",
    id: string,
    date: string,
    mealType: MealType,
    estimatedIngredients?: Array< string | null > | null,
    mealName?: string | null,
    calories?: number | null,
    proteinGrams?: number | null,
    carbsGrams?: number | null,
    fatGrams?: number | null,
    user_estimated_calories?: number | null,
    user_estimated_proteinGrams?: number | null,
    user_estimated_carbsGrams?: number | null,
    user_estimated_fatGrams?: number | null,
    photoKey?: string | null,
    estimateConfidence?: number | null,
    user?:  {
      __typename: "User",
      id: string,
      email: string,
      firstName?: string | null,
      lastName?: string | null,
      dob?: string | null,
      gender?: string | null,
      height?: number | null,
      weight?: number | null,
      goal?: Goal | null,
      age?: number | null,
      goalDate?: string | null,
      calorieGoal?: number | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    status?: StatusType | null,
    createdAt: string,
    updatedAt: string,
    userMealsId?: string | null,
    owner?: string | null,
  } | null,
};

export type OnDeleteMealSubscriptionVariables = {
  filter?: ModelSubscriptionMealFilterInput | null,
  owner?: string | null,
};

export type OnDeleteMealSubscription = {
  onDeleteMeal?:  {
    __typename: "Meal",
    id: string,
    date: string,
    mealType: MealType,
    estimatedIngredients?: Array< string | null > | null,
    mealName?: string | null,
    calories?: number | null,
    proteinGrams?: number | null,
    carbsGrams?: number | null,
    fatGrams?: number | null,
    user_estimated_calories?: number | null,
    user_estimated_proteinGrams?: number | null,
    user_estimated_carbsGrams?: number | null,
    user_estimated_fatGrams?: number | null,
    photoKey?: string | null,
    estimateConfidence?: number | null,
    user?:  {
      __typename: "User",
      id: string,
      email: string,
      firstName?: string | null,
      lastName?: string | null,
      dob?: string | null,
      gender?: string | null,
      height?: number | null,
      weight?: number | null,
      goal?: Goal | null,
      age?: number | null,
      goalDate?: string | null,
      calorieGoal?: number | null,
      createdAt: string,
      updatedAt: string,
    } | null,
    status?: StatusType | null,
    createdAt: string,
    updatedAt: string,
    userMealsId?: string | null,
    owner?: string | null,
  } | null,
};
