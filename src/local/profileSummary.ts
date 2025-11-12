import { loadLocalProfile, LocalProfile } from './profileStore';

export interface ProfileSummary {
  profile: LocalProfile | null;
  bmr: number | null; // Basal metabolic rate (Mifflin-St Jeor)
  maintenanceCalories: number | null;
  adjustedCalories: number | null; // Calorie goal after applying objective
  macroTargets: { protein: number; carbs: number; fat: number } | null; // grams per day
}

function computeBMR(p: LocalProfile): number | null {
  if (!p.weight || !p.height) return null;
  // Attempt to derive age from dob if present
  let age: number | null = null;
  if (p.dob) {
    const parts = p.dob.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const now = new Date();
      age = now.getFullYear() - d.getFullYear();
      const m = now.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    }
  }
  if (age == null) return null;
  let bmr = 10 * p.weight + 6.25 * p.height - 5 * age;
  if (p.gender && p.gender.toLowerCase().startsWith('m')) bmr += 5; else bmr -= 161;
  return Math.round(bmr);
}

function macroSplit(goal: string | null | undefined): { p: number; c: number; f: number } {
  // Percentages of calories going to each macro
  switch (goal) {
    case 'LOSE_WEIGHT':
    case 'LOSE_FAT':
      return { p: 0.35, c: 0.35, f: 0.30 };
    case 'GAIN_WEIGHT':
      return { p: 0.25, c: 0.50, f: 0.25 };
    case 'BUILD_MUSCLE':
      return { p: 0.35, c: 0.45, f: 0.20 };
    default:
      return { p: 0.30, c: 0.40, f: 0.30 };
  }
}

export async function getProfileSummary(): Promise<ProfileSummary> {
  const profile = await loadLocalProfile();
  if (!profile) return { profile: null, bmr: null, maintenanceCalories: null, adjustedCalories: null, macroTargets: null };
  const bmr = computeBMR(profile);
  const maintenance = bmr ? Math.round(bmr * 1.2) : null;
  const adjusted = profile.calorieGoal || maintenance || null;
  let macroTargets: { protein: number; carbs: number; fat: number } | null = null;
  if (adjusted) {
    const split = macroSplit(profile.goal);
    macroTargets = {
      protein: Math.round((split.p * adjusted) / 4),
      carbs: Math.round((split.c * adjusted) / 4),
      fat: Math.round((split.f * adjusted) / 9),
    };
  }
  return { profile, bmr, maintenanceCalories: maintenance, adjustedCalories: adjusted, macroTargets };
}
