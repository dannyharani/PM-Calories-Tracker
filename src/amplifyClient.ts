// Configure Amplify once, early, and expose a single GraphQL client
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import awsconfig from './aws-exports';

Amplify.configure(awsconfig as any);

// A single GraphQL client for the app
export const gqlClient = generateClient<any>();

// Backwards-compatible helpers
export async function getGraphQLClient<T extends Record<any, any> = any>() {
  return gqlClient as any as T;
}

export async function getAuthModeForGraphQL(): Promise<'userPool' | undefined> {
  try {
    const user = await getCurrentUser();
    if (user) return 'userPool';
  } catch {}
  try {
    const session = await fetchAuthSession();
    if (session?.tokens) return 'userPool';
  } catch {}
  return undefined;
}

export async function getPreferredAuthMode(): Promise<'userPool' | undefined> {
  return getAuthModeForGraphQL();
}

// Ensure a signed-in session (Cognito) is available before making owner-protected GraphQL calls.
// If backend default auth is Cognito, call this early (e.g., in root layout) and gate rendering until ready.
export async function ensureSignedIn(options: { timeoutMs?: number; pollIntervalMs?: number } = {}): Promise<boolean> {
  const { timeoutMs = 5000, pollIntervalMs = 300 } = options;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const user = await getCurrentUser();
      if (user) {
        // double-check tokens
        try {
          const session = await fetchAuthSession();
          if (session?.tokens) return true;
        } catch {
          // user present but tokens not yet hydrated; continue polling
        }
      }
    } catch {
      // not signed in yet
    }
    await new Promise(r => setTimeout(r, pollIntervalMs));
  }
  return false; // timed out; caller can proceed with API_KEY fallback or redirect to sign-in
}
