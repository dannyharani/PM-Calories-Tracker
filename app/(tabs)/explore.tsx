import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
// Offline-first: remove GraphQL; use local profile summary
import { getProfileSummary } from '@/src/local/profileSummary';
import { deleteUser as deleteUserAuth, fetchUserAttributes, getCurrentUser, signOut } from 'aws-amplify/auth';
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
  const [summary, setSummary] = useState<any | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cognito: any = await getCurrentUser();
        const attrs = await fetchUserAttributes();
        const summary = await getProfileSummary();
        if (!mounted) return;
        setFirstName(summary.profile?.firstName || cognito?.username || null);
        setEmail(attrs?.email || null);
        setGoal(summary.profile?.goal || null);
        setCalorieGoal(
          typeof summary.profile?.calorieGoal === 'number'
            ? summary.profile!.calorieGoal
            : summary.adjustedCalories ?? null
        );
        setSummary(summary);
      } catch {
        // ignore
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
    const confirmed = await showConfirm('Delete account', 'Local data will be cleared (remote account deletion disabled in offline mode). Proceed?');
    if (!confirmed) return;
    setBusy(true);
    try {
      await deleteUserAuth();
      await showAlert('Signed out', 'Account sign-out complete. (Remote deletion skipped)');
      router.replace('/auth/sign-up');
    } catch (e: any) {
      await showAlert('Error', e?.message || 'Failed to sign out');
    } finally { setBusy(false); }
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
          {summary?.bmr ? (
            <ThemedText style={{ opacity: 0.7 }}>Estimated BMR: {summary.bmr} kcal</ThemedText>
          ) : null}
          {summary?.maintenanceCalories ? (
            <ThemedText style={{ opacity: 0.7 }}>Maintenance est: {summary.maintenanceCalories} kcal</ThemedText>
          ) : null}
          {summary?.macroTargets ? (
            <ThemedText style={{ opacity: 0.7 }}>{`Macros target (g): P ${summary.macroTargets.protein} · C ${summary.macroTargets.carbs} · F ${summary.macroTargets.fat}`}</ThemedText>
          ) : null}
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
