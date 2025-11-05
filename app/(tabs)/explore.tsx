import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { createMeal as createMealMutation } from '@/src/graphql/mutations';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, Platform, StyleSheet, TextInput, View } from 'react-native';

const client = generateClient();

export default function ExploreTab() {
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [mealType, setMealType] = useState<string>('LUNCH');
  const [calories, setCalories] = useState<string>('450');
  const [ingredients, setIngredients] = useState<string>('rice, chicken, veggies');
  const [date, setDate] = useState<string>(new Date().toISOString());
  const [time, setTime] = useState<string>(new Date().toTimeString().slice(0,5));
  const [estimating, setEstimating] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const iconColor = useThemeColor({}, 'icon');

  const handleFileChange = (e: any) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFilePreview(url);
  };

  const runEstimate = async () => {
    setEstimating(true);
    await new Promise((r) => setTimeout(r, 700));
    const hour = parseInt(time.split(':')[0], 10) || 12;
    const sampledType = hour < 10 ? 'BREAKFAST' : hour < 16 ? 'LUNCH' : 'DINNER';
    setMealType(sampledType);
    const sampleCalories = sampledType === 'BREAKFAST' ? 350 : sampledType === 'LUNCH' ? 600 : 700;
    setCalories(String(sampleCalories));
    setIngredients(['ingredient1', 'ingredient2', 'ingredient3'].join(', '));
    setEstimating(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const user: any = await getCurrentUser();
      const userId = user?.userId || user?.attributes?.sub || user?.username;
      
      let datePart = date;
      if (date.includes("T")) {
         datePart = date.split('T')[0];
      }
      const localDateTimeString = `${datePart}T${time}`;
      const combinedDate = new Date(localDateTimeString);
      const finalISOTimestamp = combinedDate.toISOString();

      console.log(finalISOTimestamp)

      const input: any = {
        date: finalISOTimestamp,
        mealType,
        calories: parseInt(calories, 10) || 0,
        estimatedIngredients: ingredients.split(',').map((s) => s.trim()),
        userMealsId: userId,
      };

      await client.graphql({ query: createMealMutation, variables: { input }, authMode: 'userPool' });
      // go back to dashboard after saving
      router.replace('/dashboard');
    } catch (err) {
      console.warn('Could not save meal', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <IconSymbol name="camera" size={120} color={iconColor as string} style={{ marginBottom: 12 }} />
      <ThemedText type="title">Capture a meal</ThemedText>

      <ThemedText style={{ marginTop: 12 }}>Select or take a photo of your meal (optional)</ThemedText>

      {Platform.OS === 'web' ? (
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ marginTop: 8, backgroundColor: bgColor as any, color: textColor as any, borderColor: borderColor as any, borderWidth: 1, padding: 8, borderRadius: 6 }}
        />
      ) : (
        <Button title="Select photo (native not implemented)" onPress={() => {}} />
      )}

      {filePreview ? <Image source={{ uri: filePreview }} style={{ width: 220, height: 140, marginTop: 12, borderRadius: 8, borderWidth: 1, borderColor: borderColor as any }} /> : null}

      <View style={{ height: 12 }} />

      <Button title={estimating ? 'Estimating…' : 'Estimate calories & ingredients'} onPress={runEstimate} disabled={estimating} />

      <View style={{ height: 12 }} />

      <ThemedText style={{ marginBottom: 6 }}>Estimated / Edit</ThemedText>
      <View style={{ width: '100%' }}>
        <TextInput value={mealType} onChangeText={setMealType} style={[styles.input, { color: textColor, borderColor: borderColor, backgroundColor: bgColor }]} placeholderTextColor={borderColor as any} />
        <TextInput value={calories} onChangeText={setCalories} style={[styles.input, { color: textColor, borderColor: borderColor, backgroundColor: bgColor }]} placeholderTextColor={borderColor as any} keyboardType="numeric" />
        <TextInput value={ingredients} onChangeText={setIngredients} style={[styles.input, { color: textColor, borderColor: borderColor, backgroundColor: bgColor }]} placeholderTextColor={borderColor as any} />
        {Platform.OS === 'web' ? (
          <input
            type="date"
            value={date}
            onChange={(e: any) => setDate(e.target.value)}
            style={{ marginTop: 8, backgroundColor: bgColor as any, color: textColor as any, borderColor: borderColor as any, borderWidth: 1, padding: 8, borderRadius: 6 }}
          />
        ) : (
          <TextInput value={date} onChangeText={setDate} style={[styles.input, { color: textColor, borderColor: borderColor, backgroundColor: bgColor }]} placeholderTextColor={borderColor as any} />
        )}
        <TextInput value={time} onChangeText={setTime} style={[styles.input, { color: textColor, borderColor: borderColor, backgroundColor: bgColor }]} placeholderTextColor={borderColor as any} />
      </View>

      <View style={{ height: 12 }} />
      <Button title={saving ? 'Saving…' : 'Save meal'} onPress={handleSave} disabled={saving} />
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
  input: {
    height: 40,
    width: 300,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
});
