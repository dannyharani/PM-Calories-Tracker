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

const webRedirect = 'http://localhost:8081/';
const expoRedirect = 'exp://192.168.2.111:8081';

const isNative = Platform.OS === 'android' || Platform.OS === 'ios';

const updatedConfig = {
  ...awsconfig,
  oauth: {
    ...awsconfig.oauth,
    redirectSignIn: isNative ? expoRedirect : webRedirect,
    redirectSignOut: isNative ? expoRedirect : webRedirect,
  }
};

Amplify.configure(updatedConfig);

Amplify.configure(awsconfig);

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
