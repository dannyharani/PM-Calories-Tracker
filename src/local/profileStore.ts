import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocalProfile {
  id: string; // maps to cognito user id or anonymous local id
  firstName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  height?: number | null;
  weight?: number | null;
  dob?: string | null; // YYYY-MM-DD
  goal?: string | null; // Goal enum string
  calorieGoal?: number | null;
  photoKey?: string | null; // S3 key (optional)
  updatedAt?: string; // ISO timestamp
}

const KEY = 'localProfile';

export async function loadLocalProfile(): Promise<LocalProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveLocalProfile(p: LocalProfile): Promise<void> {
  const toSave: LocalProfile = { ...p, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(KEY, JSON.stringify(toSave));
}

export async function mergeLocalProfile(patch: Partial<LocalProfile> & { id: string }): Promise<LocalProfile> {
  const current = await loadLocalProfile();
  const merged: LocalProfile = { ...(current || { id: patch.id }), ...patch } as LocalProfile;
  await saveLocalProfile(merged);
  return merged;
}

export async function clearLocalProfile() { await AsyncStorage.removeItem(KEY); }
