import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import React from 'react';
import { Button, StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">AI Calorie Estimator</ThemedText>
      <ThemedText style={styles.description}>
        Snap a picture of your meal and let our AI estimate the calories for you.
      </ThemedText>
      <View style={styles.buttonContainer}>
        <View style={styles.buttonWrapper}>
          <Button title="Sign In" onPress={() => router.push('/auth/sign-in')} />
        </View>
        <View style={styles.buttonWrapper}>
          <Button title="Sign Up" onPress={() => router.push('/auth/sign-up')} />
        </View>
        <View style={styles.buttonWrapper}>
          <Button title="Continue as Guest" onPress={() => router.push('/explore')} />
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
