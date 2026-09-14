import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={onPress}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <SymbolView
        name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
        size={18}
        tintColor="#fff"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
