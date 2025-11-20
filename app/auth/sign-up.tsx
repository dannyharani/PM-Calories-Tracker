import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { signUp } from 'aws-amplify/auth';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';

/**
 * Sign-up screen component for new user registration.
 * 
 * Features:
 * - Email/password registration via AWS Cognito
 * - Password confirmation validation
 * - Automatic redirect to email confirmation page
 * - Error handling with user-friendly messages
 */
const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  const [errorMsg, setErrorMsg] = useState('');

  /**
   * Handles sign-up form submission.
   * 
   * Flow:
   * 1. Validate password matches confirmation
   * 2. Create account via AWS Cognito
   * 3. Redirect to email confirmation page with credentials
   *    (credentials passed to enable auto-sign-in after confirmation)
   */
  const onSignUpPressed = async () => {
    setErrorMsg('');
    // Validate passwords match before attempting registration
    if (password !== confirmPassword) {
      setErrorMsg("Passwords don't match");
      return;
    }
    try {
      const { nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });
      // After successful registration, user must confirm their email
      if (nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
        // Pass password to enable auto-sign-in after email confirmation
        router.push({ pathname: '/auth/confirm-email', params: { email, password } });
      }
    } catch (error: any) {
      setErrorMsg(error?.message || 'Error signing up');
    }
  };

  const onSignInPressed = () => {
    router.push('/auth/sign-in');
  };

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingView}
    >
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>Create an Account</ThemedText>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          style={[styles.input, { color: textColor, borderColor }]}
          placeholderTextColor={borderColor}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          style={[styles.input, { color: textColor, borderColor }]}
          placeholderTextColor={borderColor}
          secureTextEntry
        />
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm Password"
          style={[styles.input, { color: textColor, borderColor }]}
          placeholderTextColor={borderColor}
          secureTextEntry
        />
        {errorMsg ? <ThemedText style={styles.errorText}>{errorMsg}</ThemedText> : null}
        <View style={styles.buttonContainer}>
          <Button title="Sign Up" onPress={onSignUpPressed} />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Have an account? Sign In" onPress={onSignInPressed} />
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
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
  ,
  errorText: {
    color: '#ff6b6b',
    marginBottom: 10,
    textAlign: 'center',
  }
});

export default SignUp;
