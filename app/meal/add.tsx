// Import macro estimator using relative path to avoid alias resolution issues in Metro
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';

export default function RedirectAddMeal() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/(tabs)/meal/add');
  }, [router]);
  return <View />;
}
