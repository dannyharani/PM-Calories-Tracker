import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocalMeal {
  id: string;
  userMealsId: string;
  date: string; // ISO
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  calories: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  estimateConfidence?: number;
  estimatedIngredients?: string[];
  photoKey?: string;
  createdAt?: string;
  updatedAt?: string;
}

const KEY = 'localMeals';

function genId(): string { return 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8); }

export async function loadAllMeals(): Promise<LocalMeal[]> {
  try { const raw = await AsyncStorage.getItem(KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}

async function saveAll(meals: LocalMeal[]) { await AsyncStorage.setItem(KEY, JSON.stringify(meals)); }

export async function addMeal(partial: Omit<LocalMeal,'id'|'createdAt'|'updatedAt'> & { id?: string }): Promise<LocalMeal> {
  const all = await loadAllMeals();
  const meal: LocalMeal = { id: partial.id || genId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...partial };
  all.push(meal);
  await saveAll(all);
  return meal;
}

export async function getMeal(id: string): Promise<LocalMeal | undefined> {
  const all = await loadAllMeals();
  return all.find(m => m.id === id);
}

export async function updateMeal(id: string, patch: Partial<LocalMeal>): Promise<LocalMeal | undefined> {
  const all = await loadAllMeals();
  const idx = all.findIndex(m => m.id === id);
  if (idx === -1) return undefined;
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  await saveAll(all);
  return all[idx];
}

export async function mealsForDate(userId: string, date: Date): Promise<LocalMeal[]> {
  const all = await loadAllMeals();
  const y = date.getFullYear(); const m = date.getMonth(); const d = date.getDate();
  return all.filter(mel => mel.userMealsId === userId && (() => { const dt = new Date(mel.date); return dt.getFullYear()===y && dt.getMonth()===m && dt.getDate()===d; })());
}

export async function deleteMeal(id: string) {
  const all = await loadAllMeals();
  const filtered = all.filter(m => m.id !== id);
  await saveAll(filtered);
}

export async function clearMeals() { await AsyncStorage.removeItem(KEY); }
