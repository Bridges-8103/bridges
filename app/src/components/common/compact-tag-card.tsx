import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { ROUTES } from '@/constants/routes';
import { useTheme } from '@/hooks/use-theme';

export type TagField = 'skills' | 'interests' | 'expertise';

interface CompactTagCardProps {
  title: string;
  subtitle?: string;
  selectedTags: string[];
  field: TagField;
  onRemoveTag?: (tag: string) => void;
  color?: 'primary' | 'accentPurple';
  emptyText?: string;
  maxPreviewChips?: number;
}

export function CompactTagCard({
  title,
  subtitle,
  selectedTags,
  field,
  onRemoveTag,
  color = 'primary',
  emptyText = 'No tags selected yet.',
  maxPreviewChips = 8,
}: CompactTagCardProps) {
  const router = useRouter();
  const theme = useTheme();
  const accent = theme[color];

  const handleOpenSelectScreen = () => {
    router.push({
      pathname: ROUTES.SELECT_TAGS,
      params: { field },
    });
  };

  const visibleTags = selectedTags.slice(0, maxPreviewChips);
  const hiddenCount = selectedTags.length - visibleTags.length;

  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      {/* Card Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          {subtitle ? (
            <ThemedText style={[styles.subtitle, { color: theme.mutedText }]}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>

        {selectedTags.length > 0 && (
          <View style={[styles.countBadge, { backgroundColor: `${accent}15` }]}>
            <ThemedText style={[styles.countBadgeText, { color: accent }]}>
              {selectedTags.length}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Selected Chips Preview (Limited Length) */}
      <View style={styles.contentArea}>
        {selectedTags.length > 0 ? (
          <View style={styles.chipsWrap}>
            {visibleTags.map((tag) => (
              <View
                key={tag}
                style={[
                  styles.previewChip,
                  { backgroundColor: `${accent}12`, borderColor: `${accent}40` },
                ]}>
                <ThemedText style={[styles.previewChipText, { color: accent }]}>
                  {tag}
                </ThemedText>
                {onRemoveTag && (
                  <Pressable
                    onPress={() => onRemoveTag(tag)}
                    hitSlop={8}
                    style={styles.removeIconBtn}>
                    <SymbolView
                      name={{ ios: 'xmark', android: 'close', web: 'close' }}
                      size={11}
                      tintColor={accent}
                    />
                  </Pressable>
                )}
              </View>
            ))}

            {hiddenCount > 0 && (
              <Pressable
                onPress={handleOpenSelectScreen}
                style={[
                  styles.moreBadge,
                  { backgroundColor: theme.inputBackground, borderColor: theme.border },
                ]}>
                <ThemedText style={[styles.moreBadgeText, { color: theme.mutedText }]}>
                  +{hiddenCount} more
                </ThemedText>
              </Pressable>
            )}
          </View>
        ) : (
          <ThemedText style={[styles.emptyText, { color: theme.mutedText }]}>
            {emptyText}
          </ThemedText>
        )}
      </View>

      {/* Manage / Add Button: Pushes to modal stack screen */}
      <Pressable
        onPress={handleOpenSelectScreen}
        style={[
          styles.manageButton,
          { borderColor: `${accent}50`, backgroundColor: `${accent}08` },
        ]}>
        <SymbolView
          name={{
            ios: selectedTags.length > 0 ? 'pencil' : 'plus.circle.fill',
            android: selectedTags.length > 0 ? 'edit' : 'add_circle',
            web: selectedTags.length > 0 ? 'edit' : 'add_circle',
          }}
          size={15}
          tintColor={accent}
        />
        <ThemedText style={[styles.manageButtonText, { color: accent }]}>
          {selectedTags.length > 0 ? `Manage ${title}` : `Add ${title}`}
        </ThemedText>
      </Pressable>
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
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  contentArea: {
    minHeight: 36,
    justifyContent: 'center',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  previewChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  removeIconBtn: {
    padding: 2,
  },
  moreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
