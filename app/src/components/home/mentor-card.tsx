import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Mentor } from '@/types/matching';

type MentorCardProps = {
  mentor: Mentor;
  onPress?: () => void;
};

export function MentorCard({ mentor, onPress }: MentorCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {/* Avatar with Online Status */}
      <View style={styles.avatarWrapper}>
        <Image
          source={{
            uri:
              mentor.avatarUri ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
          }}
          style={styles.avatar}
        />
        {mentor.isOnline && <View style={styles.onlineBadge} />}
      </View>

      {/* Info */}
      <Text style={styles.name} numberOfLines={1}>
        {mentor.name}
      </Text>
      <Text style={styles.jobTitle} numberOfLines={1}>
        {mentor.jobTitle}
      </Text>

      {/* Expertise Tags */}
      <View style={styles.tagsRow}>
        {mentor.expertise.slice(0, 2).map((skill, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText} numberOfLines={1}>
              {skill}
            </Text>
          </View>
        ))}
      </View>

      {/* Rating & Sessions Footer */}
      <View style={styles.footer}>
        <View style={styles.ratingRow}>
          <Text style={styles.star}>★</Text>
          <Text style={styles.ratingText}>{mentor.rating?.toFixed(1) || '4.9'}</Text>
        </View>
        <Text style={styles.sessionsText}>
          {mentor.sessionCount ? `${mentor.sessionCount} sessions` : 'Active'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 175,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F1F5',
    padding: 16,
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  avatarWrapper: {
    position: 'relative',
    width: 48,
    height: 48,
    marginBottom: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  name: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  jobTitle: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'column',
    gap: 4,
    marginTop: 4,
    marginBottom: 4,
  },
  tag: {
    backgroundColor: '#F5F7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  tagText: {
    color: '#3B5DF6',
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  star: {
    color: '#F59E0B',
    fontSize: 13,
  },
  ratingText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  sessionsText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '500',
  },
});
