import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: disabled || loading ? '#D1D5DB' : theme.primary,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
      onPress={onPress}>
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <ThemedText style={styles.label}>{label}</ThemedText>
          <SymbolView
            name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
            size={18}
            tintColor="#fff"
          />
        </>
      )}
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
