import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { confirmResetPassword, resetPassword } from 'aws-amplify/auth';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, TextInput, View } from 'react-native';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');

  const onRequest = async () => {
    setErrorMsg('');
    setBusy(true);
    try {
      if (!email) throw new Error('Enter your email');
      const res = await resetPassword({ username: email });
      // If code delivery started, switch to confirm step
      if (res?.nextStep?.resetPasswordStep) {
        setStep('confirm');
      } else {
        setStep('confirm');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to start reset');
    } finally {
      setBusy(false);
    }
  };

  const onConfirm = async () => {
    setErrorMsg('');
    setBusy(true);
    try {
      if (!email || !code || !newPassword) throw new Error('Fill in all fields');
      await confirmResetPassword({ username: email, confirmationCode: code, newPassword });
      Alert.alert('Password updated', 'You can now sign in with your new password.');
      router.replace('/auth/sign-in');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to reset password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Forgot Password</ThemedText>
      {step === 'request' ? (
        <>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            style={[styles.input, { color: textColor, borderColor }]}
            placeholderTextColor={borderColor}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <View style={styles.buttonContainer}>
            <Button title={busy ? 'Sending…' : 'Send reset code'} onPress={onRequest} disabled={busy} />
          </View>
        </>
      ) : (
        <>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Confirmation code"
            style={[styles.input, { color: textColor, borderColor }]}
            placeholderTextColor={borderColor}
            keyboardType="number-pad"
          />
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password"
            style={[styles.input, { color: textColor, borderColor }]}
            placeholderTextColor={borderColor}
            secureTextEntry
          />
          <View style={styles.buttonContainer}>
            <Button title={busy ? 'Updating…' : 'Update password'} onPress={onConfirm} disabled={busy} />
          </View>
        </>
      )}
      {errorMsg ? <ThemedText style={styles.errorText}>{errorMsg}</ThemedText> : null}
      <View style={styles.buttonContainer}>
        <Button title="Back to sign in" onPress={() => router.replace('/auth/sign-in')} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { height: 40, borderWidth: 1, marginBottom: 10, paddingHorizontal: 10, borderRadius: 5 },
  buttonContainer: { marginVertical: 5 },
  errorText: { color: '#ff6b6b', marginBottom: 10, textAlign: 'center' },
});