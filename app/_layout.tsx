import '@aws-amplify/react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Amplify } from 'aws-amplify';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import awsconfig from '../src/aws-exports';
import { AuthProvider } from '../src/context/AuthContext';

import { useColorScheme } from '@/hooks/use-color-scheme';

// Configure Amplify with generated exports; React Native polyfills imported above
// Force GraphQL default auth to Cognito User Pools at runtime to match backend @auth(owner) rules.
// This safeguards against stale aws-exports defaulting to API_KEY which causes 401s for owner-protected models.
Amplify.configure({
  ...(awsconfig as any),
  aws_appsync_authenticationType: 'AMAZON_COGNITO_USER_POOLS',
} as any);

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}
