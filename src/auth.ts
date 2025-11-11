import { getCurrentUser, signIn } from 'aws-amplify/auth';

// Ensure a Cognito session exists before making owner-protected GraphQL calls.
// Replace the fallback sign-in with your real UI flow in production.
export async function ensureSignedIn(options?: { demo?: { username: string; password: string } }): Promise<boolean> {
  try {
    await getCurrentUser();
    return true;
  } catch {
    if (options?.demo) {
      await signIn({ username: options.demo.username, password: options.demo.password });
      return true;
    }
    // No session and no demo creds provided -> caller should navigate to sign-in UI
    return false;
  }
}

// Strict helper: throws if not signed in. Use before GraphQL calls when you expect an authenticated owner context.
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not signed in');
  return user;
}
