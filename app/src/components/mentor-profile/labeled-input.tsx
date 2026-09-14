import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export type LabeledInputProps = TextInputProps & {
  label: string;
};

export function LabeledInput({ label, style, ...rest }: LabeledInputProps) {
  const theme = useTheme();

  return (
    <View>
      <ThemedText style={[styles.label, { color: theme.labelText }]}>{label}</ThemedText>
      <TextInput
        style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }, style]}
        placeholderTextColor={theme.labelText}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
});
