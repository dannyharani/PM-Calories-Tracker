// Lazy-load Amplify GraphQL client to ensure Amplify.configure has run first
// and to avoid early NetInfo/Reachability initialization during expo-router route scanning.
export async function getGraphQLClient<T extends Record<any, any> = any>() {
  const { generateClient } = await import('aws-amplify/api');
  return generateClient<T>();
}
