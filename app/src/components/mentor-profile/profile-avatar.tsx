import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export function ProfileAvatar({ uri, onEdit }: { uri: string; onEdit?: () => void }) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Image source={{ uri }} style={[styles.avatar, { borderColor: theme.background }]} />
      <Pressable
        onPress={onEdit}
        style={[styles.badge, { backgroundColor: theme.primary, borderColor: theme.background }]}>
        <SymbolView
          name={{ ios: 'plus', android: 'add', web: 'add' }}
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
