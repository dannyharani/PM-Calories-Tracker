import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';

export default function RedirectMealDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = (params as any)?.id as string | undefined;
  useEffect(() => {
    if (id) {
      router.replace({ pathname: '/(tabs)/meal/[id]', params: { id } });
    } else {
      router.replace('/(tabs)/dashboard');
    }
  }, [id, router]);
  return <View />;
}
