import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getGraphQLClient, getPreferredAuthMode } from '@/src/amplifyClient';
import { ensureSignedIn } from '@/src/auth';
import { saveProfile } from '@/src/data/saveProfile';
import { createUser as createUserMutation } from '@/src/graphql/mutations';
import { getUser as getUserQuery } from '@/src/graphql/queries';
import { uploadPhotoBlob } from '@/src/storage';
import { fetchUserAttributes, getCurrentUser } from 'aws-amplify/auth';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Image, ScrollView, StyleSheet, TextInput, View } from 'react-native';

// Utility: compute age from DOB (YYYY-MM-DD)
function dobToAge(dob?: string | null): number | null {
  if (!dob) return null;
  const parts = dob.split('-');
  if (parts.length !== 3) return null;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export default function ProfileSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [isExistingUser, setIsExistingUser] = useState<boolean>(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [photoKey, setPhotoKey] = useState<string | null>(null);

  // Editable fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [dob, setDob] = useState(''); // stored as YYYY-MM-DD
  const [goal, setGoal] = useState<string>('MAINTAIN_WEIGHT');
  const [calorieGoal, setCalorieGoal] = useState<number | null>(null);

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');

  // Recalculate calorie goal when inputs or goal change
  useEffect(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const age = dobToAge(dob);
    if (!w || !h || age == null) {
      setCalorieGoal(null);
      return;
    }
    let bmr = 10 * w + 6.25 * h - 5 * age;
    if (gender?.toLowerCase() === 'male' || gender?.toLowerCase() === 'm') bmr += 5; else bmr -= 161;
    const maintenance = Math.round(bmr * 1.2);
    switch (goal) {
      case 'LOSE_WEIGHT':
        setCalorieGoal(maintenance - 500);
        break;
      case 'GAIN_WEIGHT':
        setCalorieGoal(maintenance + 500);
        break;
      case 'BUILD_MUSCLE':
        setCalorieGoal(maintenance + 250);
        break;
      case 'LOSE_FAT':
        setCalorieGoal(maintenance - 300);
        break;
      default:
        setCalorieGoal(maintenance);
    }
  }, [weight, height, dob, gender, goal]);

  // Auth gate + profile load
  useEffect(() => {
    let mounted = true;
    (async () => {
      const signedIn = await ensureSignedIn();
      if (!mounted) return;
      if (!signedIn) {
        setLoading(false);
        setAuthReady(false);
        setErrorMsg('Please sign in to view or edit your profile.');
        return;
      }
      setAuthReady(true);
      try {
        const current = await getCurrentUser();
        const id = (current as any)?.userId || (current as any)?.attributes?.sub || (current as any)?.username;
        if (!id) throw new Error('No authenticated user');
        const client = await getGraphQLClient();
        const authMode = await getPreferredAuthMode();
        const resp: any = await client.graphql({ query: getUserQuery, variables: { id }, ...(authMode ? { authMode } : {}) });
        const u = resp?.data?.getUser;
        if (u && mounted) {
          setIsExistingUser(true);
          setFirstName(u.firstName || '');
          setLastName(u.lastName || '');
          setGender(u.gender || '');
          setHeight(u.height ? String(u.height) : '');
          setWeight(u.weight ? String(u.weight) : '');
          setDob(u.dob || '');
          if (u.goal) setGoal(u.goal);
          if (typeof u.calorieGoal === 'number') setCalorieGoal(u.calorieGoal);
          if (u.photoKey) setPhotoKey(u.photoKey);
        } else if (!u) {
          const attrs = await fetchUserAttributes();
          setFirstName(attrs?.name || '');
          setIsExistingUser(false);
        }
      } catch (e: any) {
        try {
          const attrs = await fetchUserAttributes();
          setFirstName(attrs?.name || '');
          setIsExistingUser(false);
        } catch {}
        setErrorMsg(e?.message || 'Failed to load profile. You can still enter details and save.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Pick an image from library and upload to S3 using protected access
  const pickAndUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow photo library access.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
        allowsEditing: true,
      });
      if ((result as any).canceled) return;
      const asset = (result as any).assets?.[0];
      const uri = asset?.uri;
      if (!uri) return;
      setPreviewUri(uri);
      const blob = await (await fetch(uri)).blob();
      const current = await getCurrentUser();
      const userId = (current as any)?.userId || (current as any)?.attributes?.sub || (current as any)?.username;
      if (!userId) throw new Error('Not signed in');
      const key = await uploadPhotoBlob(blob as any, String(userId));
      setPhotoKey(key);
      Alert.alert('Uploaded!', `S3 key:\n${key}`);
      try {
        // Persist key if backend supports it
        await saveProfile({ id: String(userId), photoKey: key });
      } catch {
        // ignore if schema not yet pushed
      }
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message || 'Unable to upload photo');
    }
  };

  const onSave = async () => {
    setErrorMsg('');
    setStatusMsg('');
    setSaving(true);
    try {
      const current = await getCurrentUser();
      const id = (current as any)?.userId || (current as any)?.attributes?.sub || (current as any)?.username;
      if (!id) throw new Error('No authenticated user');
      const input: any = {
        id,
        firstName: firstName || null,
        lastName: lastName || null,
        gender: gender || null,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        dob: dob || undefined,
        goal: goal || undefined,
        calorieGoal: typeof calorieGoal === 'number' ? calorieGoal : undefined,
        photoKey: photoKey || undefined,
      };
      if (isExistingUser) {
        await saveProfile(input);
      } else {
        // Create requires email
        const client = await getGraphQLClient();
        const authMode = await getPreferredAuthMode();
        try {
          const attrs = await fetchUserAttributes();
          (input as any).email = attrs?.email || null;
        } catch {}
        const resp: any = await (client as any).graphql({ query: createUserMutation, variables: { input }, ...(authMode ? { authMode } : {}) });
        if (resp.errors) throw new Error(resp.errors[0]?.message || 'Create failed');
      }
      setStatusMsg('Profile updated');
      setTimeout(() => router.back(), 600);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}> 
        <ThemedText style={styles.title}>Profile Settings</ThemedText>
        <ThemedText>Loading…</ThemedText>
      </ThemedView>
    );
  }

  if (!authReady) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>Profile Settings</ThemedText>
        <ThemedText>{errorMsg || 'Sign in required.'}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Profile Settings</ThemedText>
      <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 40 }}>
        <ThemedText style={styles.label}>First Name</ThemedText>
        <TextInput value={firstName} onChangeText={setFirstName} style={[styles.input, { color: textColor, borderColor }]} placeholderTextColor={borderColor} />

        <ThemedText style={styles.label}>Last Name</ThemedText>
        <TextInput value={lastName} onChangeText={setLastName} style={[styles.input, { color: textColor, borderColor }]} placeholderTextColor={borderColor} />

        <ThemedText style={styles.label}>Gender</ThemedText>
        <TextInput value={gender} onChangeText={setGender} style={[styles.input, { color: textColor, borderColor }]} placeholder="male / female / other" placeholderTextColor={borderColor} />

        <ThemedText style={styles.label}>Height (cm)</ThemedText>
        <TextInput value={height} onChangeText={setHeight} keyboardType="numeric" style={[styles.input, { color: textColor, borderColor }]} placeholderTextColor={borderColor} />

        <ThemedText style={styles.label}>Weight (kg)</ThemedText>
        <TextInput value={weight} onChangeText={setWeight} keyboardType="numeric" style={[styles.input, { color: textColor, borderColor }]} placeholderTextColor={borderColor} />

        <ThemedText style={styles.label}>Date of Birth (YYYY-MM-DD)</ThemedText>
        <TextInput value={dob} onChangeText={setDob} placeholder="1990-05-14" style={[styles.input, { color: textColor, borderColor }]} placeholderTextColor={borderColor} />

        <ThemedText style={styles.label}>Goal</ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {[
            { label: 'Maintain weight', value: 'MAINTAIN_WEIGHT' },
            { label: 'Lose weight', value: 'LOSE_WEIGHT' },
            { label: 'Gain weight', value: 'GAIN_WEIGHT' },
            { label: 'Build muscle', value: 'BUILD_MUSCLE' },
            { label: 'Lose fat', value: 'LOSE_FAT' },
          ].map((g) => (
            <Button key={g.value} title={(goal === g.value ? '• ' : '') + g.label} onPress={() => setGoal(g.value)} />
          ))}
        </View>

        {typeof calorieGoal === 'number' ? (
          <ThemedText style={{ marginTop: 8 }}>Daily calorie target: {calorieGoal} kcal</ThemedText>
        ) : null}

        {errorMsg ? <ThemedText style={styles.error}>{errorMsg}</ThemedText> : null}
        {statusMsg ? <ThemedText style={styles.status}>{statusMsg}</ThemedText> : null}

        <View style={styles.buttonRow}>
          <Button title="Pick & Upload Photo" onPress={pickAndUpload} />
        </View>
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={{ width: 200, height: 200, marginTop: 12, borderRadius: 8 }} />
        ) : null}
        {photoKey ? (
          <ThemedText style={{ marginTop: 8 }}>Saved S3 key: {photoKey}</ThemedText>
        ) : null}

        <View style={styles.buttonRow}>
          <Button title={saving ? 'Saving…' : 'Save Changes'} onPress={onSave} disabled={saving} />
        </View>
        <View style={styles.buttonRow}>
          <Button title="Cancel" color="#666" onPress={() => router.back()} disabled={saving} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  label: { marginTop: 12, marginBottom: 4, fontWeight: '500' },
  input: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8 },
  buttonRow: { marginTop: 14 },
  error: { color: '#e74c3c', marginTop: 10 },
  status: { color: '#2e8b57', marginTop: 10 },
});
