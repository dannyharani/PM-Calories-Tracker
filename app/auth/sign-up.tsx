import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { signUp } from 'aws-amplify/auth';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, StyleSheet, TextInput, View } from 'react-native';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  const [errorMsg, setErrorMsg] = useState('');

  const onSignUpPressed = async () => {
    setErrorMsg('');
    if (password !== confirmPassword) {
      setErrorMsg("Passwords don't match");
      return;
    }
    try {
      const { isSignUpComplete, nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });
      if (nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
        // pass the password so we can auto-sign-in after confirmation
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

export default SignUp;
