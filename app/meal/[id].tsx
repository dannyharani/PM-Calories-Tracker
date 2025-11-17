import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getGraphQLClient } from '@/src/amplifyClient';
import { deleteMeal, updateMeal } from '@/src/graphql/mutations';
import { getMeal as getMealQuery, getUser as getUserQuery } from '@/src/graphql/queries';
import { getUrl } from 'aws-amplify/storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { showConfirm } from '../../src/utils/alert';
import { isStorageConfigured } from '../../src/utils/storage';

// Client will be loaded lazily on demand

export default function MealDetail() {
  const params = useLocalSearchParams();
  const id = (params as any)?.id as string | undefined;
  const router = useRouter();
  const [meal, setMeal] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState<number | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [isUpdatingIngredients, setIsUpdatingIngredients] = useState(false);

  const [editableCalories, setEditableCalories] = useState<string>('');
  const [editableProtein, setEditableProtein] = useState<string>('');
  const [editableCarbs, setEditableCarbs] = useState<string>('');
  const [editableFat, setEditableFat] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    let mounted = true;
    let pollInterval: NodeJS.Timeout | null = null;
    let pollTimeout: NodeJS.Timeout | null = null;

    const stopPolling = () => {
        if (pollInterval) clearInterval(pollInterval);
        if (pollTimeout) clearTimeout(pollTimeout);
        pollInterval = null;
        pollTimeout = null;
    };

    const load = async () => {
      if (!id) return;
      setLoading(true); // Always show loader on load
      try {
        const client = await getGraphQLClient();
        const res: any = await client.graphql({ query: getMealQuery, variables: { id }, authMode: 'userPool' });
        const data = res?.data?.getMeal;

        if (mounted) {
            setMeal(data || null);

            if (data) {
              setEditableCalories(data.user_estimated_calories?.toString() ?? data.calories?.toString() ?? '');
              setEditableProtein(data.user_estimated_proteinGrams?.toString() ?? data.proteinGrams?.toString() ?? '');
              setEditableCarbs(data.user_estimated_carbsGrams?.toString() ?? data.carbsGrams?.toString() ?? '');
              setEditableFat(data.user_estimated_fatGrams?.toString() ?? data.fatGrams?.toString() ?? '');
            }

            if (data?.status === 'PROCESSING' && !pollInterval) {
                // Start polling
                pollInterval = setInterval(load, 5000); // Poll every 5 seconds
                // Set a timeout to stop polling after 60 seconds
                pollTimeout = setTimeout(() => {
                    stopPolling();
                    console.log("Polling timed out.");
                }, 60000);
            } else if (data?.status !== 'PROCESSING') {
                stopPolling();
            }
        }
        
        if (mounted && data?.photoKey && isStorageConfigured()) {
          try {
            const result = await getUrl({ path: data.photoKey, options: { expiresIn: 3600 } });
            setPhotoUrl(String(result.url ?? result));
          } catch {
            // ignore URL errors
          }
        } else {
          setPhotoUrl(null);
        }
        // fetch user's calorie goal if available
        try {
          const ownerId = data?.userMealsId || data?.user?.id;
          if (mounted && ownerId) {
            const client = await getGraphQLClient();
            const userRes: any = await client.graphql({ query: getUserQuery, variables: { id: ownerId }, authMode: 'userPool' });
            const user = userRes?.data?.getUser;
            if (user && mounted) setCalorieGoal(user.calorieGoal ?? null);
          }
        } catch {
          // ignore
        }
        // set local ingredients copy for editing UI
        if (mounted) setIngredients(data?.estimatedIngredients || []);
      } catch (err) {
        console.warn('Could not load meal', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
      stopPolling();
    };
  }, [id]);

  useEffect(() => {
    // if meal updates, refresh editable fields and ingredients
    if (meal) {
      setIngredients(meal.estimatedIngredients || []);
      setEditableCalories(meal.user_estimated_calories?.toString() ?? meal.calories?.toString() ?? '');
      setEditableProtein(meal.user_estimated_proteinGrams?.toString() ?? meal.proteinGrams?.toString() ?? '');
      setEditableCarbs(meal.user_estimated_carbsGrams?.toString() ?? meal.carbsGrams?.toString() ?? '');
      setEditableFat(meal.user_estimated_fatGrams?.toString() ?? meal.fatGrams?.toString() ?? '');
    }
  }, [meal]);

  const handleDeleteIngredient = async (index: number) => {
    if (!meal) return;
    const before = ingredients;
    const updated = before.filter((_, i) => i !== index);
    // optimistic update
    setIngredients(updated);
    setIsUpdatingIngredients(true);
    try {
      const client = await getGraphQLClient();
      await client.graphql({
        query: updateMeal,
        variables: { input: { id: meal.id, estimatedIngredients: updated } },
        authMode: 'userPool',
      });
      // reflect on local meal object
      setMeal({ ...meal, estimatedIngredients: updated });
    } catch (err) {
      console.warn('Failed to update ingredients', err);
      // revert
      setIngredients(before);
    } finally {
      setIsUpdatingIngredients(false);
    }
  };

  const handleSaveNutrition = async () => {
    if (!meal) return;
    setIsSaving(true);
    try {
      const input = {
        id: meal.id,
        user_estimated_calories: parseInt(editableCalories, 10) || null,
        user_estimated_proteinGrams: parseFloat(editableProtein) || null,
        user_estimated_carbsGrams: parseFloat(editableCarbs) || null,
        user_estimated_fatGrams: parseFloat(editableFat) || null,
      };
      const client = await getGraphQLClient();
      await client.graphql({
        query: updateMeal,
        variables: { input },
        authMode: 'userPool',
      });
      // Also update the local meal state to reflect the changes immediately
      setMeal({
        ...meal,
        user_estimated_calories: input.user_estimated_calories,
        user_estimated_proteinGrams: input.user_estimated_proteinGrams,
        user_estimated_carbsGrams: input.user_estimated_carbsGrams,
        user_estimated_fatGrams: input.user_estimated_fatGrams,
      });
      setIsEditing(false); // Hide edit form on save
    } catch (err) {
      console.warn('Failed to save nutrition data', err);
    } finally {
      setIsSaving(false);
    }
  };

  const placeholderBg = useThemeColor({ light: '#eee', dark: '#333' }, 'background');

  const border = useThemeColor({}, 'icon');
  const cardBg = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const ingredientBg = useThemeColor({ light: '#fbfbfb', dark: '#111111' }, 'background');
  const ingredientBorderColor = useThemeColor({ light: '#f0f0f0', dark: '#272727' }, 'icon');

  const formatMealType = (t: string) => t ? (t[0] + t.toLowerCase().slice(1)) : '';
  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleString(); } catch { return d; }
  };

  return (
      <ScrollView>
    <ThemedView style={styles.container}>

      {/* Header: title and delete button moved to top to avoid accidental taps near Back */}
      <View style={styles.headerRow}>
        <ThemedText type="title">Meal details</ThemedText>
        <View style={{ width: 12 }} />
        {isDeleting ? (
          <ActivityIndicator />
        ) : meal ? (
          <Button
            title="Delete"
            color="#c62828"
            onPress={async () => {
              const ok = await showConfirm('Delete meal', 'Are you sure you want to delete this meal? This action cannot be undone.');
              if (!ok) return;
              try {
                if (!id) {
                  console.warn('No meal id to delete');
                  return;
                }
                setIsDeleting(true);
                const client = await getGraphQLClient();
                await client.graphql({ query: deleteMeal, variables: { input: { id: id } }, authMode: 'userPool' });
                router.replace('/');
              } catch (e) {
                console.warn('Failed to delete meal', e);
              } finally {
                setIsDeleting(false);
              }
            }}
          />
        ) : null}
      </View>

      {loading ? (
        // Render skeleton placeholders so layout doesn't jump when content loads
        <View style={{ width: '100%' }}>
          <View style={[{ width: '100%', height: 220, borderRadius: 8, backgroundColor: placeholderBg, marginBottom: 12 }]} />
          <View style={[styles.card, { backgroundColor: placeholderBg, borderColor: 'transparent' }]}>
            <View style={[styles.placeholderLine, { width: '50%', height: 24, backgroundColor: placeholderBg }]} />
            <View style={[styles.placeholderLine, { width: '30%', height: 16, marginTop: 8, backgroundColor: placeholderBg }]} />
            <View style={[styles.placeholderLine, { width: '40%', height: 36, marginTop: 12, backgroundColor: placeholderBg }]} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <View style={[styles.placeholderBox, { width: '48%', height: 50, backgroundColor: placeholderBg }]} />
              <View style={[styles.placeholderBox, { width: '48%', height: 50, backgroundColor: placeholderBg }]} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <View style={[styles.placeholderBox, { width: '48%', height: 50, backgroundColor: placeholderBg }]} />
              <View style={[styles.placeholderBox, { width: '48%', height: 50, backgroundColor: placeholderBg }]} />
            </View>
          </View>
          <View style={{marginTop: 24}}>
            <View style={[styles.placeholderLine, { width: '40%', height: 20, backgroundColor: placeholderBg, marginBottom: 12 }]} />
            <View style={[styles.placeholderBox, { width: '100%', height: 60, backgroundColor: placeholderBg, marginBottom: 10 }]} />
            <View style={[styles.placeholderBox, { width: '100%', height: 60, backgroundColor: placeholderBg, marginBottom: 10 }]} />
          </View>
        </View>
      ) : meal ? (
        <View style={{ width: '100%' }}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.headerPhoto} />
          ) : null}

          {meal.status === 'PROCESSING' && (
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: border, alignItems: 'center', padding: 20, marginBottom: 12 }]}>
                <ActivityIndicator size="large" />
                <ThemedText style={{marginTop: 12, fontWeight: '600'}}>Analyzing Meal...</ThemedText>
                <ThemedText style={{marginTop: 4, textAlign: 'center', fontSize: 12}}>Our AI is processing the nutritional information. This page will update automatically.</ThemedText>
            </View>
          )}

          {meal.status !== 'PROCESSING' && (
            <>
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}> 
                <View style={styles.cardHeader}>
                  <View>
                    <ThemedText type="title" style={{maxWidth: "90%", textOverflow: "wrap"}}>{formatMealType(meal.mealName ? meal.mealName : meal.mealType)}</ThemedText>
                    <ThemedText style={{ color: textColor }}>{formatDate(meal.date)}</ThemedText>
                  </View>
                  <Pressable onPress={() => setIsEditing(!isEditing)} style={{ padding: 4 }}>
                    <IconSymbol name="pencil" size={22} color={textColor as any} />
                  </Pressable>
                </View>

                <View style={styles.caloriesRow}>
                  <ThemedText style={styles.caloriesBig}>{meal.user_estimated_calories ?? meal.calories}</ThemedText>
                  <ThemedText style={{ marginLeft: 8 }}>kcal</ThemedText>
                </View>

                <View style={styles.macroGrid}>
                  <View style={styles.macroItem}><ThemedText style={styles.macroLabel}>Protein</ThemedText><ThemedText style={styles.macroValue}>{Math.round((meal.user_estimated_proteinGrams ?? meal.proteinGrams) || 0)} g</ThemedText></View>
                  <View style={styles.macroItem}><ThemedText style={styles.macroLabel}>Carbs</ThemedText><ThemedText style={styles.macroValue}>{Math.round((meal.user_estimated_carbsGrams ?? meal.carbsGrams) || 0)} g</ThemedText></View>
                  <View style={styles.macroItem}><ThemedText style={styles.macroLabel}>Fat</ThemedText><ThemedText style={styles.macroValue}>{Math.round((meal.user_estimated_fatGrams ?? meal.fatGrams) || 0)} g</ThemedText></View>
                  <View style={styles.macroItem}><ThemedText style={styles.macroLabel}>Confidence</ThemedText><ThemedText style={styles.macroValue}>{meal.estimateConfidence ? `${Math.round(meal.estimateConfidence * 100)}%` : '—'}</ThemedText></View>
                </View>

                {calorieGoal ? (
                  <View style={{ marginTop: 12 }}>
                    <ThemedText style={{ marginBottom: 6 }}>Daily contribution</ThemedText>
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.round(((meal.user_estimated_calories ?? meal.calories) / calorieGoal) * 100))}%`, backgroundColor: "#6a32aaff" }]} />
                    </View>
                    <ThemedText style={{ marginTop: 6 }}>{Math.round(((meal.user_estimated_calories ?? meal.calories) / calorieGoal) * 100)}% of daily goal ({calorieGoal} kcal)</ThemedText>
                  </View>
                ) : null}

              </View>

              {isEditing && (
                <View style={[styles.card, { backgroundColor: cardBg, borderColor: border, marginTop: 12 }]}>
                  <ThemedText type="subtitle" style={{ marginBottom: 8 }}>Edit Nutrition</ThemedText>
                  <View style={styles.editRow}>
                    <ThemedText style={styles.editLabel}>Calories</ThemedText>
                    <TextInput
                      value={editableCalories}
                      onChangeText={setEditableCalories}
                      keyboardType="numeric"
                      style={[styles.input, { color: textColor, borderColor: border }]}
                    />
                  </View>
                  <View style={styles.editRow}>
                    <ThemedText style={styles.editLabel}>Protein (g)</ThemedText>
                    <TextInput
                      value={editableProtein}
                      onChangeText={setEditableProtein}
                      keyboardType="numeric"
                      style={[styles.input, { color: textColor, borderColor: border }]}
                    />
                  </View>
                  <View style={styles.editRow}>
                    <ThemedText style={styles.editLabel}>Carbs (g)</ThemedText>
                    <TextInput
                      value={editableCarbs}
                      onChangeText={setEditableCarbs}
                      keyboardType="numeric"
                      style={[styles.input, { color: textColor, borderColor: border }]}
                    />
                  </View>
                  <View style={styles.editRow}>
                    <ThemedText style={styles.editLabel}>Fat (g)</ThemedText>
                    <TextInput
                      value={editableFat}
                      onChangeText={setEditableFat}
                      keyboardType="numeric"
                      style={[styles.input, { color: textColor, borderColor: border }]}
                    />
                  </View>
                  <View style={{marginTop: 12}}>
                    <Button title={isSaving ? 'Saving...' : 'Save Nutrition'} onPress={handleSaveNutrition} disabled={isSaving} />
                  </View>
                </View>
              )}

              {/* Ingredients list (editable) */}
              <View style={{ width: '100%', marginTop: 12 }}>
                <ThemedText style={{ fontWeight: '700', marginBottom: 8 }}>Ingredients</ThemedText>
                {ingredients && ingredients.length ? (
                  ingredients.map((ing, i) => (
                    <View
                      key={i}
                      style={[
                        styles.ingredientRow,
                        {
                          backgroundColor: ingredientBg as any,
                          borderColor: ingredientBorderColor as any,
                          shadowColor: ingredientBorderColor as any,
                          elevation: 3,
                        },
                      ]}
                    >
                      <ThemedText style={[styles.ingredientText, { color: textColor }]}>{ing}</ThemedText>
                      <Pressable
                        onPress={() => handleDeleteIngredient(i)}
                        disabled={isUpdatingIngredients}
                      >
                        <IconSymbol name="trash" size={32} color="#c62828" />
                      </Pressable>
                    </View>
                  ))
                ) : (
                  <ThemedText style={{ color: '#888' }}>No ingredients</ThemedText>
                )}
              </View>
            </>
          )}
        </View>
      ) : (
        <ThemedText>No meal found.</ThemedText>
      )}

      <View style={{ height: 12 }} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Button title="Back" onPress={() => {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.push('/');
            }
        }} />
      </View>
    </ThemedView>
      </ScrollView>
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
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeholderLine: {
    borderRadius: 6,
  },
  placeholderBox: {
    width: '100%',
    height: 40,
    borderRadius: 8,
  },
  headerPhoto: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 8,
  },
  caloriesBig: {
    paddingVertical: 2,
    fontSize: 36,
    fontWeight: '700',
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  macroItem: {
    width: '48%',
    marginVertical: 6,
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e6e6e6',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    // subtle drop shadow (iOS)
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    // elevation for Android
    elevation: 3,
    minHeight: 48,
  },
  ingredientText: {
    fontSize: 16,
    flex: 1,
    marginRight: 12,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  editLabel: {
    flex: 1,
    marginRight: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flex: 1,
  },
});
