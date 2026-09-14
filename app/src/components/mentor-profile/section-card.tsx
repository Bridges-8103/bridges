import { StyleSheet, View, type ViewProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export type SectionCardProps = ViewProps & {
  title: string;
  subtitle?: string;
};

export function SectionCard({ title, subtitle, style, children, ...rest }: SectionCardProps) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.card }, style]} {...rest}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      {subtitle ? (
        <ThemedText style={[styles.subtitle, { color: theme.mutedText }]}>{subtitle}</ThemedText>
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  content: {
    marginTop: 12,
    gap: 12,
  },
});
