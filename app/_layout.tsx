import '@aws-amplify/react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
// Initialize Amplify once by importing the client (which calls Amplify.configure)
import '@/src/amplifyClient';
import { signOut } from 'aws-amplify/auth';
import { useEffect } from 'react';
import { AuthProvider } from '../src/context/AuthContext';

import { useColorScheme } from '@/hooks/use-color-scheme';

// Amplify is configured by src/amplifyClient on import

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Force logout on cold start to guarantee unauthenticated entry state.
  useEffect(() => {
    (async () => {
      try { await signOut({ global: true }); } catch {}
    })();
  }, []);

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
