// Import macro estimator using relative path to avoid alias resolution issues in Metro
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getGraphQLClient } from '@/src/amplifyClient';
import { Picker } from '@react-native-picker/picker';
import { getCurrentUser } from 'aws-amplify/auth';
import { uploadData } from 'aws-amplify/storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Button, Image, Platform, StyleSheet, TextInput, View } from 'react-native';
import { estimateFromLabels, estimateFromMealType, MealType as EstMealType } from '../../../src/utils/macroEstimator';
import { getStorageMissingMessage, isStorageConfigured } from '../../../src/utils/storage';

// Client will be loaded lazily when saving

const createMealGql = /* GraphQL */ `
mutation CreateMeal($input: CreateMealInput!) {
  createMeal(input: $input) {
    id
  }
}`;

type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export default function AddMealScreen() {
  const router = useRouter();
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');

  const [mealType, setMealType] = useState<MealType>('LUNCH');
  const [labelsText, setLabelsText] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [estimation, setEstimation] = useState<{
    proteinGrams: number; carbsGrams: number; fatGrams: number; calories: number; estimateConfidence: number;
  } | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickPhoto = async () => {
    setError(null);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setError('Camera permission is required to take a photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.6,
      });
      if ((result as any).canceled) return;
      const asset = (result as any).assets?.[0];
      if (asset?.uri) {
        setPhotoUri(asset.uri);
      }
    } catch (e: any) {
      setError(e?.message || 'Unable to open camera');
    }
  };

  const parsedLabels = useMemo(() => labelsText.split(',').map(s => s.trim()).filter(Boolean), [labelsText]);

  const onEstimate = async () => {
    setIsEstimating(true);
    setError(null);
    try {
      if (parsedLabels.length > 0) {
        const est = estimateFromLabels(mealType as EstMealType, parsedLabels);
        setEstimation(est);
      } else {
        const est = estimateFromMealType(mealType as EstMealType);
        setEstimation(est);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to estimate macros');
    } finally {
      setIsEstimating(false);
    }
  };

  const onSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const user = await getCurrentUser();
      const userId = (user as any)?.userId || (user as any)?.username;
      if (!userId) throw new Error('Not signed in');

      const nowIso = new Date().toISOString();
      const est = estimation || estimateFromMealType(mealType as EstMealType);
      let photoKey: string | undefined;
      if (photoUri && isStorageConfigured()) {
        // Upload to S3. Convert to blob (Expo fetch) then Storage.put.
        const response = await fetch(photoUri);
        const blob = await response.blob();
        const ext = photoUri.split('.').pop() || 'jpg';
        const key = `meal-photos/${userId}/${Date.now()}.${ext}`;
        await uploadData({ key, data: blob, options: { contentType: (blob as any).type || 'image/jpeg' } }).result;
        photoKey = key;
      } else if (photoUri && !isStorageConfigured()) {
        // Do not block saving the meal; just inform the user.
        setError(getStorageMissingMessage());
      }

      const input: any = {
        date: nowIso,
        mealType,
        calories: Math.round(est.calories),
        estimatedIngredients: parsedLabels,
        proteinGrams: est.proteinGrams,
        carbsGrams: est.carbsGrams,
        fatGrams: est.fatGrams,
        estimateConfidence: est.estimateConfidence,
        userMealsId: userId,
        photoKey,
      };

  const client = await getGraphQLClient();
  const res: any = await client.graphql({ query: createMealGql, variables: { input }, authMode: 'userPool' });
      const id = res?.data?.createMeal?.id;
  if (id) router.replace({ pathname: '/meal/[id]', params: { id } });
      else router.back();
    } catch (e: any) {
      setError(e?.message || 'Failed to save meal');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Add Meal</ThemedText>
      <View style={styles.row}>
        <ThemedText style={{ marginBottom: 6 }}>Meal type</ThemedText>
        <View style={[styles.pickerWrapper, { borderColor: borderColor as any }] }>
          <Picker selectedValue={mealType} onValueChange={(v) => setMealType(v)}>
            <Picker.Item label="Breakfast" value="BREAKFAST" />
            <Picker.Item label="Lunch" value="LUNCH" />
            <Picker.Item label="Dinner" value="DINNER" />
            <Picker.Item label="Snack" value="SNACK" />
          </Picker>
        </View>
      </View>

      <View style={styles.row}>
        <Button title={photoUri ? 'Retake Photo' : 'Take Photo'} onPress={pickPhoto} />
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
        ) : null}
      </View>

      <View style={styles.row}>
  <ThemedText>Optional: comma-separated labels (e.g., &quot;chicken, rice&quot;)</ThemedText>
        <TextInput
          placeholder="Add labels"
          placeholderTextColor={borderColor as any}
          value={labelsText}
          onChangeText={setLabelsText}
          style={[styles.input, { borderColor: borderColor as any, color: textColor as any }]}
        />
      </View>

      <View style={styles.row}>
        <Button title={isEstimating ? 'Estimating…' : 'Estimate Macros'} onPress={onEstimate} disabled={isEstimating} />
      </View>

      {estimation ? (
        <View style={{ width: '100%', marginTop: 8 }}>
          <ThemedText>Calories: {Math.round(estimation.calories)} kcal</ThemedText>
          <ThemedText>Protein: {Math.round(estimation.proteinGrams)} g</ThemedText>
          <ThemedText>Carbs: {Math.round(estimation.carbsGrams)} g</ThemedText>
          <ThemedText>Fat: {Math.round(estimation.fatGrams)} g</ThemedText>
          <ThemedText>Confidence: {(estimation.estimateConfidence * 100).toFixed(0)}%</ThemedText>
        </View>
      ) : null}

      {error ? <ThemedText style={{ color: '#e74c3c', marginTop: 8 }}>{error}</ThemedText> : null}

      <View style={styles.footer}>
        {isSaving ? <ActivityIndicator /> : <Button title="Save Meal" onPress={onSave} />}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  row: { width: '100%', marginTop: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: Platform.select({ ios: 10, default: 8 }),
    marginTop: 6,
  },
  pickerWrapper: { borderWidth: 1, borderRadius: 6, overflow: 'hidden' },
  preview: { width: '100%', height: 200, borderRadius: 8, marginTop: 10 },
  footer: { marginTop: 16 },
});
