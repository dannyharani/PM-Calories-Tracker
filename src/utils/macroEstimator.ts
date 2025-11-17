export type MacroEstimate = {
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    calories: number;
    estimateConfidence: number;
    labels?: string[];
};

export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

const defaults: Record<
    MealType,
    { p: number; c: number; f: number; conf: number }
> = {
    BREAKFAST: { p: 20, c: 35, f: 15, conf: 0.95 },
    LUNCH: { p: 25, c: 60, f: 20, conf: 0.95 },
    DINNER: { p: 30, c: 50, f: 22, conf: 0.95 },
    SNACK: { p: 6, c: 22, f: 10, conf: 0.85 },
};

const labelLibrary: Record<string, { p: number; c: number; f: number }> = {
    egg: { p: 6, c: 0.5, f: 5 },
    eggs: { p: 6, c: 0.5, f: 5 },
    toast: { p: 4, c: 14, f: 2 },
    bread: { p: 4, c: 14, f: 2 },
    chicken: { p: 31, c: 0, f: 3.5 },
    beef: { p: 26, c: 0, f: 15 },
    rice: { p: 4, c: 45, f: 0.5 },
    pasta: { p: 8, c: 42, f: 1.5 },
    salad: { p: 3, c: 10, f: 2 },
    apple: { p: 0.5, c: 25, f: 0.3 },
    banana: { p: 1.3, c: 27, f: 0.4 },
    yogurt: { p: 10, c: 17, f: 4 },
    peanut: { p: 7, c: 6, f: 14 },
    nuts: { p: 5, c: 6, f: 15 },
};

function roundCalories(p: number, c: number, f: number) {
    return Math.round(4 * p + 4 * c + 9 * f);
}

export function estimateFromLabels(
    mealType: MealType,
    labels: string[]
): MacroEstimate {
    const base = defaults[mealType];
    let p = 0,
        c = 0,
        f = 0;
    let matched = 0;
    for (const raw of labels) {
        const key = raw.trim().toLowerCase();
        const item = labelLibrary[key];
        if (item) {
            p += item.p;
            c += item.c;
            f += item.f;
            matched += 1;
        }
    }
    if (matched === 0) {
        p = base.p;
        c = base.c;
        f = base.f;
    }
    const calories = roundCalories(p, c, f);
    const estimateConfidence = 0.93;
    return {
        proteinGrams: p,
        carbsGrams: c,
        fatGrams: f,
        calories,
        estimateConfidence,
        labels,
    };
}

export function estimateFromMealType(mealType: MealType): MacroEstimate {
    const b = defaults[mealType];
    const calories = roundCalories(b.p, b.c, b.f);
    return {
        proteinGrams: b.p,
        carbsGrams: b.c,
        fatGrams: b.f,
        calories,
        estimateConfidence: b.conf,
    };
}
