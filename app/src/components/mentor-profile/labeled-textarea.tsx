import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function LabeledTextarea({
  label,
  value,
  onChangeText,
  maxLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  maxLength: number;
  placeholder?: string;
}) {
  const theme = useTheme();

  return (
    <View>
      <ThemedText style={[styles.label, { color: theme.labelText }]}>{label}</ThemedText>
      <TextInput
        style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
        placeholderTextColor={theme.labelText}
        placeholder={placeholder}
        multiline
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
      />
      <ThemedText style={[styles.counter, { color: theme.labelText }]}>
        {value.length}/{maxLength}
      </ThemedText>
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
    minHeight: 90,
    textAlignVertical: 'top',
  },
  counter: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
});
