import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { deleteUser, getCurrentUser, signOut } from 'aws-amplify/auth';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, View } from 'react-native';
import { showAlert, showConfirm } from '../utils/alert';

export default function DashboardScreen() {
  const [username, setUsername] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      try {
  const user: any = await getCurrentUser();
        if (mounted) {
          setUsername(user?.username || user?.attributes?.email || null);
        }
      } catch (err) {
        // Not authenticated, redirect to sign-in
        router.replace('/auth/sign-in');
      }
    };
    fetchUser();
    return () => {
      mounted = false;
    };
  }, [router]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setStatusMessage('Signing out...');
    try {
      await signOut();
      router.replace('/auth/sign-in');
    } catch (error: any) {
      console.error('Error signing out: ', error);
      setStatusMessage(error?.message || 'Failed to sign out');
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await showConfirm('Delete account', 'This will permanently delete your account. Are you sure?');
    if (!confirmed) return;

    setIsDeleting(true);
    setStatusMessage('Deleting account...');
    try {
      await deleteUser();
      await showAlert('Account deleted', 'Your account has been deleted.');
      router.replace('/auth/sign-up');
    } catch (err: any) {
      console.error('Error deleting user', err);
      const msg = err?.message || 'Failed to delete account';
      await showAlert('Error', msg);
      setStatusMessage(msg);
      setIsDeleting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Dashboard</ThemedText>
      <ThemedText>{username ? `Hello, ${username}` : 'Welcome to your dashboard!'}</ThemedText>
      {statusMessage ? <ThemedText style={styles.status}>{statusMessage}</ThemedText> : null}
      <Button title={isSigningOut ? 'Signing out...' : 'Sign Out'} onPress={handleSignOut} disabled={isSigningOut || isDeleting} />
      <View style={{ height: 10 }} />
      <Button title={isDeleting ? 'Deleting...' : 'Delete Account'} color="#d9534f" onPress={handleDeleteAccount} disabled={isSigningOut || isDeleting} />
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
  status: {
    marginVertical: 10,
    color: '#ff6b6b',
    textAlign: 'center',
  },
});
