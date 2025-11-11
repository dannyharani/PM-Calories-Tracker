import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getGraphQLClient, getPreferredAuthMode } from '@/src/amplifyClient';
import { ensureSignedIn } from '@/src/auth';
// Use storage helpers to get signed URL and metadata
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, Image, StyleSheet, View } from 'react-native';
import { fetchObjectMetadata, getSignedUrl, isStorageConfigured } from '../../../src/utils/storage';

// Client will be loaded lazily on demand

export default function MealDetail() {
  const params = useLocalSearchParams();
  const id = (params as any)?.id as string | undefined;
  const router = useRouter();
  const [meal, setMeal] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoMeta, setPhotoMeta] = useState<{
    contentType?: string;
    size?: number;
    lastModified?: Date;
    metadata?: Record<string, string>;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const GET_MEAL_DETAIL = /* GraphQL */ `
      query GetMeal($id: ID!) {
        getMeal(id: $id) {
          id
          date
          mealType
          calories
          estimatedIngredients
          proteinGrams
          carbsGrams
          fatGrams
          estimateConfidence
          dateTime
          photoKey
        }
      }
    `;
  const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
    const ok = await ensureSignedIn();
    if (!ok) throw new Error('Not signed in');
  const client = await getGraphQLClient();
  const authMode = await getPreferredAuthMode();
  const res: any = await client.graphql({ query: GET_MEAL_DETAIL, variables: { id }, ...(authMode ? { authMode } : {}) });
        const data = res?.data?.getMeal;
        if (mounted) setMeal(data || null);
        if (mounted && data?.photoKey && isStorageConfigured()) {
          try {
            const url = await getSignedUrl(data.photoKey, 3600);
            setPhotoUrl(url);
            const props = await fetchObjectMetadata(data.photoKey);
            setPhotoMeta(props);
          } catch {
            // ignore URL errors
          }
        } else {
          setPhotoUrl(null);
          setPhotoMeta(null);
        }
      } catch (err) {
        console.warn('Could not load meal', err);
        setErrorMsg((err as any)?.message || 'Failed to load meal');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Derived macro percentages
  const macroSection = meal && typeof meal.proteinGrams === 'number' && typeof meal.carbsGrams === 'number' && typeof meal.fatGrams === 'number'
    ? (() => {
        const p = meal.proteinGrams || 0;
        const c = meal.carbsGrams || 0;
        const f = meal.fatGrams || 0;
        const calories = meal.calories || Math.round(p*4 + c*4 + f*9);
        const pc = p*4, cc = c*4, fc = f*9;
        const totalCalForPct = Math.max(1, pc + cc + fc);
        return { p, c, f, calories, pc, cc, fc, totalCalForPct };
      })()
    : null;

  return (
    <ThemedView style={styles.container}>
      {loading && <ThemedText>Loading…</ThemedText>}
      {!loading && !meal && (
        <View style={{ width: '100%' }}>
          <ThemedText>No meal found.</ThemedText>
          {id ? <ThemedText style={{ opacity: 0.8, marginTop: 4 }}>Meal ID: {String(id)}</ThemedText> : null}
          {errorMsg ? <ThemedText style={{ color: '#e74c3c', marginTop: 6 }}>{errorMsg}</ThemedText> : null}
        </View>
      )}
      {meal && (
        <View style={{ width: '100%' }}>
          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <ThemedText style={styles.summaryTitle}>{meal.mealType?.toLowerCase() || 'meal'}</ThemedText>
            <ThemedText style={styles.summaryCalories}>{meal.calories} kcal</ThemedText>
            {meal.date ? (
              <ThemedText style={styles.summaryMeta}>Date: {meal.date.split('T')[0]}</ThemedText>
            ) : null}
            {meal.dateTime ? (
              <ThemedText style={styles.summaryMeta}>Time: {meal.dateTime}</ThemedText>
            ) : null}
            {typeof meal.estimateConfidence === 'number' ? (
              <ThemedText style={styles.summaryMeta}>Confidence: {(meal.estimateConfidence * 100).toFixed(0)}%</ThemedText>
            ) : null}
            {macroSection && (
              <View style={{ marginTop: 8 }}>
                <View style={styles.macroLine}> 
                  <ThemedText style={styles.macroLabel}>Protein</ThemedText>
                  <ThemedText style={styles.macroValue}>{Math.round(macroSection.p)}g</ThemedText>
                </View>
                <View style={styles.progressBarSmall}><View style={[styles.progressFillSmall, { width: `${Math.min((macroSection.pc / macroSection.totalCalForPct)*100,100)}%`, backgroundColor: '#6c5ce7' }]} /></View>
                <View style={styles.macroLine}> 
                  <ThemedText style={styles.macroLabel}>Carbs</ThemedText>
                  <ThemedText style={styles.macroValue}>{Math.round(macroSection.c)}g</ThemedText>
                </View>
                <View style={styles.progressBarSmall}><View style={[styles.progressFillSmall, { width: `${Math.min((macroSection.cc / macroSection.totalCalForPct)*100,100)}%`, backgroundColor: '#00b894' }]} /></View>
                <View style={styles.macroLine}> 
                  <ThemedText style={styles.macroLabel}>Fat</ThemedText>
                  <ThemedText style={styles.macroValue}>{Math.round(macroSection.f)}g</ThemedText>
                </View>
                <View style={styles.progressBarSmall}><View style={[styles.progressFillSmall, { width: `${Math.min((macroSection.fc / macroSection.totalCalForPct)*100,100)}%`, backgroundColor: '#fdcb6e' }]} /></View>
              </View>
            )}
          </View>

          {photoUrl ? (
            <>
              <Image source={{ uri: photoUrl }} style={styles.photo} />
              {photoMeta?.metadata ? (
                <View style={{ marginTop: 8 }}>
                  <ThemedText style={{ fontWeight: 'bold', marginBottom: 4 }}>Photo metadata</ThemedText>
                  {photoMeta.metadata.mealType ? (
                    <ThemedText>Meal type: {photoMeta.metadata.mealType}</ThemedText>
                  ) : null}
                  {photoMeta.metadata.date ? (
                    <ThemedText>Uploaded for date: {String(photoMeta.metadata.date).split('T')[0]}</ThemedText>
                  ) : null}
                  {photoMeta.metadata.calories ? (
                    <ThemedText>Calories: {photoMeta.metadata.calories} kcal</ThemedText>
                  ) : null}
                </View>
              ) : null}
            </>
          ) : null}

          {/* Detailed sections */}
          {macroSection && (
            <View style={{ marginTop: 16 }}>
              <ThemedText style={{ fontWeight: 'bold', marginBottom: 4 }}>Macros detail</ThemedText>
              <ThemedText>Protein: {Math.round(macroSection.p)} g ({((macroSection.pc / macroSection.totalCalForPct)*100).toFixed(0)}% kcal)</ThemedText>
              <ThemedText>Carbs: {Math.round(macroSection.c)} g ({((macroSection.cc / macroSection.totalCalForPct)*100).toFixed(0)}% kcal)</ThemedText>
              <ThemedText>Fat: {Math.round(macroSection.f)} g ({((macroSection.fc / macroSection.totalCalForPct)*100).toFixed(0)}% kcal)</ThemedText>
            </View>
          )}
          {meal.estimatedIngredients && meal.estimatedIngredients.length ? (
            <View style={{ marginTop: 16 }}>
              <ThemedText style={{ fontWeight: 'bold', marginBottom: 4 }}>Ingredients</ThemedText>
              {meal.estimatedIngredients.map((ing: string, i: number) => (
                <ThemedText key={i}>• {ing}</ThemedText>
              ))}
            </View>
          ) : null}
        </View>
      )}

      <View style={{ height: 24 }} />
      <Button title="Back" onPress={() => router.back()} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
  },
  row: {
    marginVertical: 6,
  },
  summaryCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e2e2',
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#ffffff10',
    marginBottom: 12,
  },
  summaryTitle: { textTransform: 'capitalize', fontSize: 16, fontWeight: '600' },
  summaryCalories: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  summaryMeta: { fontSize: 12, opacity: 0.75, marginTop: 2 },
  macroLine: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  macroLabel: { fontSize: 12, opacity: 0.85 },
  macroValue: { fontSize: 12, fontWeight: '600' },
  progressBarSmall: { height: 6, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden', marginTop: 4 },
  progressFillSmall: { height: '100%' },
  photo: { width: '100%', height: 220, borderRadius: 12, marginTop: 8 },
});
