import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Mentor } from '@/types/matching';
import type { MentorProfile } from '@/services/mentors/types';

export type MentorCardData = Mentor | MentorProfile;

type MentorCardProps = {
  mentor: MentorCardData;
  score?: number;
  matchReason?: string;
  onPress?: () => void;
};

export function MentorCard({ mentor, score, matchReason, onPress }: MentorCardProps) {
  const avatarUri =
    'avatarUrl' in mentor && mentor.avatarUrl
      ? mentor.avatarUrl
      : 'avatarUri' in mentor && mentor.avatarUri
      ? mentor.avatarUri
      : undefined;

  const initials = mentor.name
    ? mentor.name
        .split(' ')
        .filter((part) => !part.includes('.'))
        .slice(0, 2)
        .map((p) => p.charAt(0))
        .join('')
        .toUpperCase()
    : 'ME';

  const expertiseList = mentor.expertise ?? [];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {/* Top Header with Avatar & Match Badge */}
      <View style={styles.topHeader}>
        <View style={styles.avatarWrapper}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={styles.onlineBadge} />
        </View>

        {score !== undefined && score > 0 ? (
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreBadgeText}>{score}% Match</Text>
          </View>
        ) : null}
      </View>

      {/* Info */}
      <Text style={styles.name} numberOfLines={1}>
        {mentor.name}
      </Text>
      <Text style={styles.jobTitle} numberOfLines={1}>
        {mentor.jobTitle || 'Faculty Researcher'}
      </Text>

      {/* College / Department */}
      {mentor.company ? (
        <Text style={styles.companyText} numberOfLines={1}>
          {mentor.company}
        </Text>
      ) : null}

      {/* Expertise Tags */}
      <View style={styles.tagsRow}>
        {expertiseList.slice(0, 2).map((skill, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText} numberOfLines={1}>
              {skill}
            </Text>
          </View>
        ))}
        {expertiseList.length === 0 && (
          <View style={[styles.tag, { backgroundColor: '#F3F4F6' }]}>
            <Text style={[styles.tagText, { color: '#6B7280' }]} numberOfLines={1}>
              Adelaide Mentor
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.ratingRow}>
          <Text style={styles.star}>★</Text>
          <Text style={styles.ratingText}>
            {typeof mentor.rating === 'number' ? mentor.rating.toFixed(1) : '4.9'}
          </Text>
        </View>
        <Text style={styles.sessionsText} numberOfLines={1}>
          {matchReason || 'Available'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F1F5',
    padding: 16,
    gap: 4,
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  avatarWrapper: {
    position: 'relative',
    width: 48,
    height: 48,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3B5DF6',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  scoreBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  scoreBadgeText: {
    color: '#3B5DF6',
    fontSize: 11,
    fontWeight: '800',
  },
  name: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  jobTitle: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '500',
  },
  companyText: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  tagsRow: {
    flexDirection: 'column',
    gap: 4,
    marginTop: 4,
    marginBottom: 4,
    minHeight: 44,
  },
  tag: {
    backgroundColor: '#F5F7FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  star: {
    color: '#F59E0B',
    fontSize: 12,
  },
  ratingText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  sessionsText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '500',
    maxWidth: 90,
  },
});
