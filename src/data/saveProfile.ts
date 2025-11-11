import { gqlClient } from '@/src/amplifyClient';
import { requireUser } from '@/src/auth';

// Narrow mutation for updating user profile fields, including optional photoKey.
const updateUserMinimal = /* GraphQL */ `
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      id
      height
      weight
      dob
      goal
      calorieGoal
      photoKey
      updatedAt
    }
  }
`;

export interface SaveProfileInput {
  id: string;
  height?: number;
  weight?: number;
  dob?: string;
  goal?: string;
  calorieGoal?: number | null;
  photoKey?: string;
}

export async function saveProfile(input: SaveProfileInput) {
  await requireUser();
  const res: any = await gqlClient.graphql({
    query: updateUserMinimal,
    variables: { input },
    authMode: 'userPool',
  });
  const updated = res?.data?.updateUser;
  if (!updated) throw new Error(res?.errors?.[0]?.message || 'Failed to update profile');
  return updated;
}
