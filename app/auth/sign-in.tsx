import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { fetchAuthSession, getCurrentUser, signIn } from 'aws-amplify/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Button,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

/**
 * Sign-in screen component for user authentication.
 * 
 * Features:
 * - Email/password authentication via AWS Cognito
 * - Automatic redirect if already signed in
 * - User-friendly error message mapping
 * - Handles unconfirmed email flow
 * - Guest mode placeholder (future feature)
 */
const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();
  const isGuestFlow = params.guest === 'true';

  // Check if user is already signed in on component mount
  // If signed in, redirect to dashboard automatically
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        await getCurrentUser();
        // User is already authenticated, redirect to dashboard
        if (mounted) router.replace('/(tabs)/dashboard');
      } catch {
        // User not signed in, remain on sign-in page
      } finally {
        mounted && setCheckingSession(false);
      }
    };
    check();
    // Cleanup to prevent state updates after unmount
    return () => { mounted = false; };
  }, [router]);

  /**
   * Maps AWS Cognito error codes to user-friendly error messages.
   * Provides clear, actionable feedback for common authentication errors.
   */
  const mapAuthError = (error: any): string => {
    const code = error?.code || error?.name;
    const raw = (error?.message || '').toString();
    if (code === 'UserNotConfirmedException') return 'Email not confirmed. Check your inbox.';
    if (code === 'UserNotFoundException') return 'Account not found.';
    if (code === 'NotAuthorizedException') return 'Incorrect email or password.';
    if (code === 'PasswordResetRequiredException') return 'Password reset required.';
    if (/attempt limit exceeded/i.test(raw)) return 'Too many attempts. Try later.';
    return raw || 'Failed to sign in.';
  };

  /**
   * Handles sign-in form submission.
   * 
   * Flow:
   * 1. Validate email and password are provided
   * 2. Attempt sign-in via AWS Cognito
   * 3. Fetch auth session to ensure credentials are valid
   * 4. Redirect to dashboard on success
   * 5. Handle special case: unconfirmed email (redirect to confirmation)
   * 6. Display user-friendly error messages for other failures
   */
  const onSignInPressed = async () => {
    setErrorMsg('');
    setIsSigningIn(true);
    if (!email.trim() || !password) {
      setErrorMsg(errorMsg + 'Enter email and password.');
      setIsSigningIn(false);
      return;
    }
    try {
      // Sign in with email (as username) and password
      await signIn({ username: email.trim().toLowerCase(), password });
      try {
        // Fetch session to ensure authentication is complete
        await fetchAuthSession();
      } catch (sessErr) {
        console.warn('Session fetch failed:', sessErr);
      }
      // Success - redirect to dashboard
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      console.error('Sign in error', error);
      const code = error?.code || error?.name;
      // Special handling for unconfirmed email - redirect to confirmation page
      if (code === 'UserNotConfirmedException') {
        router.push({ pathname: '/auth/confirm-email', params: { email, password } });
      } else {
        // Map error to user-friendly message
        const mapped = mapAuthError(error);
        const fallback = (error?.message && String(error.message)) || JSON.stringify(error);
        setErrorMsg(mapped || fallback || 'Failed to sign in.');
        console.log(fallback)
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const onForgotPasswordPressed = () => router.push('/auth/forgot-password');
  const onSignUpPressed = () => router.push('/auth/sign-up');

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');

  if (isGuestFlow) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>Guest Mode</ThemedText>
        <ThemedText style={{ textAlign: 'center', marginBottom: 20 }}>
          Guest mode is currently under development and will be available in a future version. For now, please sign in or create an account to use the app.
        </ThemedText>
        <View style={styles.buttonContainer}>
          <Button title="Back to Home" onPress={() => router.replace('/(tabs)')} />
        </View>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <ThemedView style={styles.container}>
            <ThemedText style={styles.title}>Sign In</ThemedText>
            <Text style={styles.inputTitle}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              style={[styles.input, { color: textColor, borderColor }]}
              placeholderTextColor={borderColor}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.inputTitle}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              style={[styles.input, { color: textColor, borderColor }]}
              placeholderTextColor={borderColor}
              secureTextEntry
            />
            {errorMsg ? <ThemedText style={styles.errorText}>{errorMsg}</ThemedText> : null}
            <View style={styles.buttonContainer}>
              <Button
                title={checkingSession ? 'Checking…' : isSigningIn ? 'Signing in…' : 'Sign In'}
                onPress={onSignInPressed}
                disabled={checkingSession || isSigningIn}
              />
            </View>

            {/* Inline links on same y plane */}
            <View style={styles.linksRow}>
              <TouchableOpacity onPress={onForgotPasswordPressed} accessibilityRole="button">
                <ThemedText style={styles.linkText}>Forgot password?</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={onSignUpPressed} accessibilityRole="button">
                <ThemedText style={styles.linkText}>Create account</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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
    height: 50,
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
  },
  inputTitle: {
    margin: 4,
    marginTop: 10,
    marginBottom: 2,
    opacity: 70,
    color: '#8e8e8eff'
  }
  ,
  linksRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  linkText: {
    color: '#2573ff',
    fontWeight: '600',
  }
});

export default SignIn;
