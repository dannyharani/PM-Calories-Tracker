import { ThemedText } from '@/components/themed-text';
import { getSignedUrl, isStorageConfigured } from '@/src/utils/storage';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface AvatarProps {
  photoKey?: string | null;
  size?: number;
  fallbackText?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ photoKey, size = 64, fallbackText = '👤' }) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (photoKey && isStorageConfigured()) {
        try {
          const u = await getSignedUrl(photoKey, 3600);
          if (mounted) setUrl(u);
        } catch {
          if (mounted) setUrl(null);
        }
      } else {
        setUrl(null);
      }
    })();
    return () => { mounted = false; };
  }, [photoKey]);

  if (url) {
    return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}> 
      <ThemedText style={{ fontSize: size * 0.4 }}>{fallbackText}</ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Avatar;
