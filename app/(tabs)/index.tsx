import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getCurrentUser } from 'aws-amplify/auth';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, View } from 'react-native';

/**
 * Home screen component - Landing page for the AI Calorie Estimator app.
 * Displays different options based on authentication status.
 * 
 * Features:
 * - Checks authentication status on mount
 * - Shows sign-in/sign-up buttons for unauthenticated users
 * - Shows dashboard link for authenticated users
 * - Provides guest mode option (currently placeholder)
 */
export default function HomeScreen() {
  const router = useRouter();
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Check authentication status when component mounts
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const user: any = await getCurrentUser();
        // Only update state if component is still mounted (prevents memory leaks)
        if (mounted && user) setIsSignedIn(true);
      } catch {
        // User is not signed in
        if (mounted) setIsSignedIn(false);
      }
    };
    check();
    // Cleanup function to prevent state updates after unmount
    return () => { mounted = false; };
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">AI Calorie Estimator</ThemedText>
      <ThemedText style={styles.description}>
        Snap a picture of your meal and let our AI estimate the calories for you.
      </ThemedText>
      <View style={styles.buttonContainer}>
        {!isSignedIn ? (
          <>
            {/* Show authentication options for unauthenticated users */}
            <View style={styles.buttonWrapper}>
              <Button title="Sign In" onPress={() => router.push('/auth/sign-in')} />
            </View>
            <View style={styles.buttonWrapper}>
              <Button title="Sign Up" onPress={() => router.push('/auth/sign-up')} />
            </View>
          </>
        ) : (
          /* Show dashboard link for authenticated users */
          <View style={styles.buttonWrapper}>
            <Button title="Go to Dashboard" onPress={() => router.push('/dashboard')} />
          </View>
        )}
        {/* Guest mode - currently shows placeholder message */}
        <View style={styles.buttonWrapper}>
          <Button title="Continue as Guest" onPress={() => router.push('/auth/sign-in?guest=true')} />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  description: {
    marginVertical: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 20,
    width: '80%',
  },
  buttonWrapper: {
    marginVertical: 5,
  },
});
