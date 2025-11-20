// Polyfills required for React Native compatibility with AWS Amplify
import 'react-native-get-random-values';
import 'react-native-url-polyfill';

import '@aws-amplify/react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Amplify } from 'aws-amplify';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import awsconfig from '../src/aws-exports';
import { AuthProvider } from '../src/context/AuthContext';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Platform } from 'react-native';

// OAuth redirect URLs for different platforms
// Web uses localhost for development, native uses Expo deep linking
const webRedirect = 'http://localhost:8081/';
const expoRedirect = 'exp://192.168.2.111:8081';

// Determine if running on native platform (iOS/Android) vs web
const isNative = Platform.OS === 'android' || Platform.OS === 'ios';

// Update Amplify config with platform-specific OAuth redirects
// This ensures authentication flows work correctly on both web and mobile
const updatedConfig = {
  ...awsconfig,
  oauth: {
    ...awsconfig.oauth,
    redirectSignIn: isNative ? expoRedirect : webRedirect,
    redirectSignOut: isNative ? expoRedirect : webRedirect,
  }
};

// Configure Amplify with the updated config
Amplify.configure(updatedConfig);

// Note: This second configure call may be redundant and could be removed
Amplify.configure(awsconfig);

// Expo Router unstable settings - sets the initial route anchor
export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * Root layout component that wraps the entire application.
 * Provides theme support (light/dark mode) and authentication context.
 * 
 * Navigation structure:
 * - (tabs): Main tab navigation (home, capture, dashboard)
 * - modal: Modal screens for overlays
 */
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
