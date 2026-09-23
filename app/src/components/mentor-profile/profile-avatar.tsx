import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=256&h=256&fit=crop&crop=faces';

export function ProfileAvatar({ uri, onEdit }: { uri?: string; onEdit?: () => void }) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: uri || DEFAULT_AVATAR }}
        style={[styles.avatar, { borderColor: theme.background }]}
      />
      <Pressable
        onPress={onEdit}
        style={[styles.badge, { backgroundColor: theme.primary, borderColor: theme.background }]}>
        <SymbolView
          name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }}
          size={16}
          tintColor="#fff"
        />
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
