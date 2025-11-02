import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { confirmSignUp, signIn } from 'aws-amplify/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, TextInput, View } from 'react-native';

const ConfirmEmail = () => {
  const [code, setCode] = useState('');
  const router = useRouter();
  const { email, password } = useLocalSearchParams<{ email: string; password?: string }>();

  const onConfirmPressed = async () => {
    if (!email) {
        Alert.alert('Error', 'Email not found');
        return;
    }
    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: email,
        confirmationCode: code,
      });
      if (isSignUpComplete) {
        // If we have the password (passed from sign-up or sign-in attempt), sign the user in automatically
        if (password) {
          try {
            await signIn({ username: email, password });
            router.replace('/auth/user-info');
            return;
          } catch (err: any) {
            // If auto sign-in fails, fall back to the sign-in screen
            Alert.alert('Signed up', 'Confirmation succeeded but automatic sign-in failed. Please sign in manually.');
            router.replace('/auth/sign-in');
            return;
          }
        }

        // No password available: route to sign-in so user can authenticate
        router.replace('/auth/sign-in');
      }
    } catch (error: any) {
      Alert.alert('Error confirming sign up', error.message);
    }
  };

  const onResendCodePressed = () => {
    // Placeholder for resend code logic
    console.log('Resend code pressed');
  };

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Confirm Your Email</ThemedText>
      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="Confirmation Code"
        style={[styles.input, { color: textColor, borderColor }]}
        placeholderTextColor={borderColor}
        keyboardType="numeric"
      />
      <View style={styles.buttonContainer}>
        <Button title="Confirm" onPress={onConfirmPressed} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Resend Code" onPress={onResendCodePressed} />
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
    },
    input: {
      height: 40,
      borderWidth: 1,
      marginBottom: 10,
      paddingHorizontal: 10,
      borderRadius: 5,
    },
    buttonContainer: {
      marginVertical: 5,
    }
  });

export default ConfirmEmail;
