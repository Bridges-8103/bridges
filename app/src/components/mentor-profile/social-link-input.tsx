import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

const BADGES = {
  linkedin: { initials: 'in', color: '#0A66C2' },
  github: { initials: 'gh', color: '#181717' },
  twitter: { initials: 'tw', color: '#1DA1F2' },
} as const;

export function SocialLinkInput({
  platform,
  label,
  value,
  placeholder,
  onChangeText,
}: {
  platform: keyof typeof BADGES;
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
}) {
  const theme = useTheme();
  const badge = BADGES[platform];

  return (
    <View>
      <ThemedText style={[styles.label, { color: theme.labelText }]}>{label}</ThemedText>
      <View style={[styles.field, { backgroundColor: theme.inputBackground }]}>
        <View style={[styles.badge, { backgroundColor: badge.color }]}>
          <ThemedText style={styles.badgeText}>{badge.initials}</ThemedText>
        </View>
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder={placeholder}
          placeholderTextColor={theme.labelText}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
        />
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
  },
});
