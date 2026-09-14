import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function SelectField({
  label,
  value,
  options,
  onChange,
  style,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  style?: { flex?: number };
}) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  return (
    <View style={style}>
      <ThemedText style={[styles.label, { color: theme.labelText }]}>{label}</ThemedText>
      <Pressable
        style={[styles.field, { backgroundColor: theme.inputBackground }]}
        onPress={() => setOpen(true)}>
        <ThemedText style={{ color: theme.text }} numberOfLines={1}>
          {value}
        </ThemedText>
        <SymbolView
          name={{ ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }}
          size={18}
          tintColor={theme.labelText}
        />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: theme.card }]}>
            <ThemedText style={styles.sheetTitle}>{label}</ThemedText>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.option, { borderTopColor: theme.border }]}
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}>
                  <ThemedText style={{ color: item === value ? theme.primary : theme.text }}>
                    {item}
                  </ThemedText>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
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
  field: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '60%',
  },
  sheetTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  option: {
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
