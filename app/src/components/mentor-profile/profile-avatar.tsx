import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '@clerk/expo';

import { useTheme } from '@/hooks/use-theme';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=256&h=256&fit=crop&crop=faces';

export function ProfileAvatar({ uri, onEdit }: { uri?: string; onEdit?: () => void }) {
  const theme = useTheme();
  const { user } = useUser();
  const [isUploading, setIsUploading] = useState(false);

  const displayUri = user?.imageUrl || uri || DEFAULT_AVATAR;

  const handlePickImage = async () => {
    if (onEdit) {
      onEdit();
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please allow photo access to update your avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.base64 && user) {
        setIsUploading(true);
        const mimeType = result.assets[0].mimeType || 'image/jpeg';
        await user.setProfileImage({
          file: `data:${mimeType};base64,${result.assets[0].base64}`,
        });
        Alert.alert('Avatar Updated', 'Your profile picture has been updated.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update avatar image.';
      Alert.alert('Upload Error', message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: displayUri }}
        style={[styles.avatar, { borderColor: theme.background }]}
      />
      <Pressable
        accessibilityRole="button"
        disabled={isUploading}
        onPress={handlePickImage}
        style={[styles.badge, { backgroundColor: theme.primary, borderColor: theme.background }]}>
        {isUploading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <SymbolView
            name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }}
            size={16}
            tintColor="#fff"
          />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
  },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
