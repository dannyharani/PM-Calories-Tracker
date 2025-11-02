import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getCurrentUser, signIn } from 'aws-amplify/auth';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, StyleSheet, TextInput, View } from 'react-native';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const [errorMsg, setErrorMsg] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);

  React.useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const user = await getCurrentUser();
        if (mounted && user) {
          // already signed in -> redirect to dashboard
          router.replace('/dashboard');
        }
      } catch (e) {
        // not signed in
      } finally {
        if (mounted) setCheckingSession(false);
      }
    };
    check();
    return () => {
      mounted = false;
    };
  }, [router]);

  const onSignInPressed = async () => {
    setErrorMsg('');
    try {
      // Basic sign-in using Amplify Auth (modular import)
      await signIn({ username: email, password });
      // On success, navigate to dashboard
      router.replace('/dashboard');
    } catch (error: any) {
      // If user hasn't confirmed email, redirect to confirmation screen
      const code = error?.code || error?.name;
      if (code === 'UserNotConfirmedException' || /not confirmed/i.test(error?.message || '')) {
        // pass the attempted password so confirm flow can sign the user in after confirmation
        router.push({ pathname: '/auth/confirm-email', params: { email, password } });
        return;
      }

      const message = error?.message || 'Failed to sign in';
      setErrorMsg(message);
    }
  };

  const onForgotPasswordPressed = () => {
    // Placeholder for forgot password logic
    console.log('Forgot password pressed');
  };

  const onSignUpPressed = () => {
    router.push('/auth/sign-up');
  };

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
      {errorMsg ? (
        <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
      ) : null}
      <View style={styles.buttonContainer}>
        <Button title={checkingSession ? 'Checking…' : 'Sign In'} onPress={onSignInPressed} disabled={checkingSession} />
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
