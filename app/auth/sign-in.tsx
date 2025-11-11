import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { fetchAuthSession, getCurrentUser, signIn } from 'aws-amplify/auth';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, TextInput, View } from 'react-native';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const user = await getCurrentUser();
        if (mounted && user) router.replace('/(tabs)/dashboard');
      } catch {
        // remain on sign-in
      } finally {
        mounted && setCheckingSession(false);
      }
    };
    check();
    return () => { mounted = false; };
  }, [router]);

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

  const onSignInPressed = async () => {
    setErrorMsg('');
    setIsSigningIn(true);
    if (!email.trim() || !password) {
      setErrorMsg('Enter email and password.');
      setIsSigningIn(false);
      return;
    }
    try {
      await signIn({ username: email.trim().toLowerCase(), password });
      try {
        const session = await fetchAuthSession();
        console.log('Auth session after signIn', {
          hasTokens: !!session.tokens,
          identityId: session.identityId,
        });
      } catch (sessErr) {
        console.warn('Session fetch failed:', sessErr);
      }
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      const code = error?.code || error?.name;
      if (code === 'UserNotConfirmedException') {
        router.push({ pathname: '/auth/confirm-email', params: { email, password } });
      } else {
        setErrorMsg(mapAuthError(error));
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const onForgotPasswordPressed = () => router.push('/auth/forgot-password');
  const onSignUpPressed = () => router.push('/auth/sign-up');

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Sign In</ThemedText>
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
      {errorMsg ? <ThemedText style={styles.errorText}>{errorMsg}</ThemedText> : null}
      <View style={styles.buttonContainer}>
        <Button
          title={checkingSession ? 'Checking…' : isSigningIn ? 'Signing in…' : 'Sign In'}
          onPress={onSignInPressed}
          disabled={checkingSession || isSigningIn}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Forgot Password?" onPress={onForgotPasswordPressed} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Don't have an account? Sign Up" onPress={onSignUpPressed} />
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
  ,
  errorText: {
    color: '#ff6b6b',
    marginBottom: 10,
    textAlign: 'center',
  }
});

export default SignIn;
