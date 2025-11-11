// Use static imports to avoid dynamic module fetches that can fail on web when Metro restarts.
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';

export async function getGraphQLClient<T extends Record<any, any> = any>() {
  return generateClient<T>();
}

// Helper to decide auth mode dynamically based on current config
export async function getAuthModeForGraphQL(): Promise<'userPool' | undefined> {
  try {
    // If a user is present, prefer userPool even if tokens are still being hydrated
    const user = await getCurrentUser();
    if (user) return 'userPool';
  } catch {
    // ignore
  }
  try {
    const session = await fetchAuthSession();
    if (session?.tokens) return 'userPool';
  } catch {
    // fall through
  }
  return undefined; // use default (API_KEY) when no user session
}

// Prefer Cognito User Pool auth when a user session exists; fall back to default otherwise.
export async function getPreferredAuthMode(): Promise<'userPool' | undefined> {
  return getAuthModeForGraphQL();
}
