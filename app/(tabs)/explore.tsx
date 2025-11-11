import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getGraphQLClient } from '@/src/amplifyClient';
import { deleteUser as deleteUserMutation } from '@/src/graphql/mutations';
import { getUser as getUserQuery } from '@/src/graphql/queries';
import { deleteUser as deleteUserAuth, getCurrentUser, signOut } from 'aws-amplify/auth';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, View } from 'react-native';
import { showAlert, showConfirm } from '../../src/utils/alert';

// Client will be loaded when saving

export default function ProfileTab() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [calorieGoal, setCalorieGoal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  // colors, in case we add more UI later
  // const textColor = useThemeColor({}, 'text');
  // const borderColor = useThemeColor({}, 'icon');
  const iconColor = useThemeColor({}, 'icon');
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cognito: any = await getCurrentUser();
        const id = cognito?.userId || cognito?.attributes?.sub || cognito?.username;
        const client = await getGraphQLClient();
        const res: any = await client.graphql({ query: getUserQuery, variables: { id }, authMode: 'userPool' });
        const u = res?.data?.getUser;
        if (mounted) {
          setFirstName(u?.firstName || cognito?.username || null);
          setEmail(u?.email || cognito?.attributes?.email || null);
          setGoal(u?.goal || null);
          setCalorieGoal(typeof u?.calorieGoal === 'number' ? u.calorieGoal : null);
        }
      } catch {
        // noop
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
      router.replace('/auth/sign-in');
    } catch (e: any) {
      await showAlert('Error', e?.message || 'Failed to sign out');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await showConfirm('Delete account', 'This will permanently delete your account. Are you sure?');
    if (!confirmed) return;
    setBusy(true);
    try {
      const { userId } = await getCurrentUser();
      const client = await getGraphQLClient();
      await client.graphql({ query: deleteUserMutation, variables: { input: { id: userId } }, authMode: 'userPool' });
      await deleteUserAuth();
      await showAlert('Account deleted', 'Your account has been deleted.');
      router.replace('/auth/sign-up');
    } catch (e: any) {
      await showAlert('Error', e?.message || 'Failed to delete account');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <IconSymbol name="person.fill" size={80} color={iconColor as string} style={{ marginBottom: 8 }} />
      <ThemedText type="title">Profile</ThemedText>

      {!loading ? (
        <View style={styles.card}>
          {firstName ? <ThemedText style={{ fontSize: 16, marginBottom: 4 }}>Hello, {firstName}</ThemedText> : null}
          {email ? <ThemedText style={{ opacity: 0.8 }}>Email: {email}</ThemedText> : null}
          {goal ? <ThemedText style={{ opacity: 0.8 }}>Goal: {goal.replace(/_/g, ' ').toLowerCase()}</ThemedText> : null}
          {typeof calorieGoal === 'number' ? <ThemedText style={{ opacity: 0.8 }}>Calorie goal: {calorieGoal} kcal</ThemedText> : null}
        </View>
      ) : (
        <ThemedText style={{ marginTop: 8 }}>Loading…</ThemedText>
      )}

      <View style={{ height: 12 }} />
      <Button title="Open Profile Settings" onPress={() => router.push('/profile/settings')} />
      <View style={{ height: 8 }} />
      <Button title={busy ? 'Signing out…' : 'Sign Out'} onPress={handleSignOut} disabled={busy} />
      <View style={{ height: 8 }} />
      <Button title={busy ? 'Deleting…' : 'Delete Account'} color="#d9534f" onPress={handleDeleteAccount} disabled={busy} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    backgroundColor: '#ffffff10',
  },
});
