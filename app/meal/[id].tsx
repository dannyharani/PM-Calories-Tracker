import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getMeal as getMealQuery } from '@/src/graphql/queries';
import { generateClient } from 'aws-amplify/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, View } from 'react-native';

const client = generateClient();

export default function MealDetail() {
  const params = useLocalSearchParams();
  const id = (params as any)?.id as string | undefined;
  const router = useRouter();
  const [meal, setMeal] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res: any = await client.graphql({ query: getMealQuery, variables: { id }, authMode: 'userPool' });
        const data = res?.data?.getMeal;
        if (mounted) setMeal(data || null);
      } catch (err) {
        console.warn('Could not load meal', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Meal details</ThemedText>
      {loading ? (
        <ThemedText>Loading…</ThemedText>
      ) : meal ? (
        <View style={{ width: '100%' }}>
          <ThemedText style={styles.row}>Type: {meal.mealType}</ThemedText>
          <ThemedText style={styles.row}>Calories: {meal.calories} kcal</ThemedText>
          <ThemedText style={styles.row}>Date: {meal.date}</ThemedText>
          {meal.dateTime ? <ThemedText style={styles.row}>Time: {meal.dateTime}</ThemedText> : null}
          {meal.estimatedIngredients && meal.estimatedIngredients.length ? (
            <View style={{ marginTop: 8 }}>
              <ThemedText style={{ fontWeight: 'bold' }}>Ingredients:</ThemedText>
              {meal.estimatedIngredients.map((ing: string, i: number) => (
                <ThemedText key={i}>• {ing}</ThemedText>
              ))}
            </View>
          ) : null}
        </View>
      ) : (
        <ThemedText>No meal found.</ThemedText>
      )}

      <View style={{ height: 16 }} />
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
});
