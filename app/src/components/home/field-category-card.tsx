import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FieldCategory } from '@/types/home';

type FieldCategoryCardProps = {
  category: FieldCategory;
  isSelected?: boolean;
  onPress?: () => void;
};

export function FieldCategoryCard({ category, isSelected, onPress }: FieldCategoryCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isSelected && styles.selectedCard,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.iconContainer, { backgroundColor: category.bgColor || '#F3F4F8' }]}>
        <Text style={styles.icon}>{category.icon}</Text>
      </View>
      <Text style={[styles.title, isSelected && styles.selectedTitle]}>
        {category.title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0F1F5',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 78,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  selectedCard: {
    borderColor: '#3B5DF6',
    backgroundColor: '#F5F7FF',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  title: {
    color: '#1F2937',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedTitle: {
    color: '#3B5DF6',
    fontWeight: '700',
  },
});
