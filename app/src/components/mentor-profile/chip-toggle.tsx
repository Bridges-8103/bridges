import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function ChipToggle({
  label,
  selected,
  color = 'primary',
  onPress,
}: {
  label: string;
  selected: boolean;
  color?: 'primary' | 'accentPurple';
  onPress: () => void;
}) {
  const theme = useTheme();
  const accent = theme[color];

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: selected ? accent : theme.border,
          backgroundColor: selected ? `${accent}1A` : theme.inputBackground,
        },
      ]}>
      {selected ? (
        <SymbolView
          name={{ ios: 'checkmark', android: 'check', web: 'check' }}
          size={14}
          tintColor={accent}
        />
      ) : null}
      <ThemedText style={{ color: selected ? accent : theme.mutedText, fontSize: 14 }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
