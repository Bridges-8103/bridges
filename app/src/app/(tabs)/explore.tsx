import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { CompactTagCard } from '@/components/common/compact-tag-card';
import { ROUTES } from '@/constants/routes';
import { useRole } from '@/hooks/use-role';
import { useUpdateProfileMutation } from '@/services/profile/mutations';
import { useMentorsQuery, useSuggestedMentorsQuery } from '@/services/mentors/queries';
import { useTaxonomyQuery } from '@/services/taxonomy/queries';
import type { MentorProfile } from '@/services/mentors/types';

export default function ExploreScreen() {
  const router = useRouter();
  const { profile, isMentor, isStudent } = useRole();
  const updateProfileMutation = useUpdateProfileMutation();

  const profileInterests = profile?.studentDetail?.interests;
  const [localInterests, setLocalInterests] = useState<string[]>([
    'Machine learning',
    'Python',
  ]);

  const selectedInterests =
    profileInterests && profileInterests.length > 0 ? profileInterests : localInterests;

  const handleRemoveInterest = (tagToRemove: string) => {
    const updated = selectedInterests.filter((t) => t !== tagToRemove);
    setLocalInterests(updated);
    if (profile?.id) {
      updateProfileMutation.mutate({ id: profile.id, input: { interests: updated } });
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch real taxonomy categories from backend
  const { data: taxonomyCategories = [] } = useTaxonomyQuery();

  const isFiltering = Boolean(selectedCategory || searchQuery.trim());

  // 1. If searching or filtered by category: query database mentors
  const {
    data: filteredResult,
    isLoading: isFilteredLoading,
  } = useMentorsQuery(
    isFiltering
      ? {
          category: selectedCategory ?? undefined,
          search: searchQuery.trim() || undefined,
          limit: 30,
        }
      : undefined,
    { enabled: isFiltering }
  );

  // 2. Default state: interest-ranked mentor suggestions from database (or all mentors for mentors)
  const {
    data: suggestedMatches = [],
    isLoading: isSuggestionsLoading,
  } = useSuggestedMentorsQuery(isStudent ? selectedInterests : [], 30, { enabled: !isFiltering });

  const handleBook = (mentor: MentorProfile) => {
    if (isMentor) {
      // Mentors cannot book sessions
      return;
    }
    router.push(ROUTES.mentorBook(mentor.id));
  };

  const handleViewMentor = (mentorId: string) => {
    router.push(ROUTES.mentorDetail(mentorId));
  };

  const isLoading = isFiltering ? isFilteredLoading : isSuggestionsLoading;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.title}>
              {isMentor ? 'Mentor & Faculty Directory' : 'Find Your Mentor'}
            </Text>
            <View
              style={[
                styles.roleBadge,
                isMentor ? styles.roleBadgeMentor : styles.roleBadgeStudent,
              ]}>
              <Text
                style={[
                  styles.roleBadgeText,
                  isMentor ? styles.roleBadgeTextMentor : styles.roleBadgeTextStudent,
                ]}>
                {isMentor ? '🌟 Colleague Network' : '🎓 Find Mentors'}
              </Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            {isMentor
              ? 'Search university faculty, researchers, and fellow mentors across departments.'
              : 'Explore university researchers and faculty mentors matched to your academic goals.'}
          </Text>
        </View>

        {/* Mentor role notice banner */}
        {isMentor && (
          <View style={styles.mentorBanner}>
            <SymbolView
              name={{ ios: 'info.circle.fill', android: 'info', web: 'info' }}
              size={16}
              tintColor="#7C3AED"
            />
            <Text style={styles.mentorBannerText}>
              You can search and view peer profiles. Mentorship session booking is reserved for student accounts.
            </Text>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            size={18}
            tintColor="#9CA3AF"
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              isMentor
                ? 'Search colleague by name, department, or field…'
                : 'Search by mentor name, role, department, or skill…'
            }
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <SymbolView
                name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' }}
                size={16}
                tintColor="#9CA3AF"
              />
            </Pressable>
          )}
        </View>

        {/* Category Horizontal Pills */}
        <View style={styles.categorySection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryTabsScroll}>
            <Pressable
              onPress={() => setSelectedCategory(null)}
              style={[
                styles.categoryTab,
                selectedCategory === null && styles.categoryTabActive,
              ]}>
              <Text
                style={[
                  styles.categoryTabText,
                  selectedCategory === null && styles.categoryTabTextActive,
                ]}>
                All Fields
              </Text>
            </Pressable>

            {taxonomyCategories.map((cat) => {
              const isSelected = selectedCategory === cat.slug;
              return (
                <Pressable
                  key={cat.slug}
                  onPress={() => setSelectedCategory(isSelected ? null : cat.slug)}
                  style={[
                    styles.categoryTab,
                    isSelected && styles.categoryTabActive,
                  ]}>
                  <Text
                    style={[
                      styles.categoryTabText,
                      isSelected && styles.categoryTabTextActive,
                    ]}>
                    {cat.name}
                  </Text>
                  {cat.mentorCount > 0 && (
                    <View
                      style={[
                        styles.categoryCountBadge,
                        isSelected && styles.categoryCountBadgeActive,
                      ]}>
                      <Text
                        style={[
                          styles.categoryCountText,
                          isSelected && styles.categoryCountTextActive,
                        ]}>
                        {cat.mentorCount}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Categorized Interests Selector (Students only) */}
        {isStudent && !isFiltering && (
          <CompactTagCard
            title="Your Interests"
            subtitle="Match with mentors specializing in these topics"
            selectedTags={selectedInterests}
            field="interests"
            onRemoveTag={handleRemoveInterest}
            color="primary"
            emptyText="No interests selected. Tap below to find mentors by topic."
          />
        )}

        {/* Results Section */}
        <View style={styles.section}>
          <View style={styles.resultsHeader}>
            <Text style={styles.sectionLabel}>
              {isFiltering
                ? 'Search Results'
                : isMentor
                ? 'Faculty & Mentors'
                : 'Recommended Mentors'}
            </Text>
            <Text style={styles.matchCountBadge}>
              {isFiltering
                ? `${filteredResult?.total ?? 0} Mentors`
                : `${suggestedMatches.length} Mentors`}
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B5DF6" />
              <Text style={styles.loadingText}>Loading mentors from database…</Text>
            </View>
          ) : isFiltering ? (
            // Filtered mentors list
            filteredResult && filteredResult.items.length > 0 ? (
              <View style={styles.matchesList}>
                {filteredResult.items.map((mentor) => (
                  <MentorListItem
                    key={mentor.id}
                    mentor={mentor}
                    isMentorUser={isMentor}
                    onPress={() => handleViewMentor(mentor.id)}
                    onBook={() => handleBook(mentor)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No mentors found</Text>
                <Text style={styles.emptySubtitle}>
                  Try clearing your search query or choosing a different field category.
                </Text>
              </View>
            )
          ) : (
            // Suggested matches list
            suggestedMatches.length > 0 ? (
              <View style={styles.matchesList}>
                {suggestedMatches.map((match) => (
                  <MentorListItem
                    key={match.mentor.id}
                    mentor={match.mentor}
                    score={isStudent ? match.score : undefined}
                    reasons={isStudent ? match.matchReasons : undefined}
                    isMentorUser={isMentor}
                    onPress={() => handleViewMentor(match.mentor.id)}
                    onBook={() => handleBook(match.mentor)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No mentors found</Text>
                <Text style={styles.emptySubtitle}>
                  {isStudent
                    ? 'Add interests above to unlock personalized recommendations.'
                    : 'Check back later as new faculty join the platform.'}
                </Text>
              </View>
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MentorListItem({
  mentor,
  score,
  reasons,
  isMentorUser,
  onPress,
  onBook,
}: {
  mentor: MentorProfile;
  score?: number;
  reasons?: string[];
  isMentorUser?: boolean;
  onPress: () => void;
  onBook: () => void;
}) {
  const initials = mentor.name
    .split(' ')
    .filter((p) => !p.includes('.'))
    .slice(0, 2)
    .map((p) => p.charAt(0))
    .join('')
    .toUpperCase();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.matchCard, pressed && styles.cardPressed]}>
      <View style={styles.cardTop}>
        {mentor.avatarUrl ? (
          <Image source={{ uri: mentor.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>{initials || 'ME'}</Text>
          </View>
        )}

        <View style={styles.mentorInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.mentorName} numberOfLines={1}>
              {mentor.name}
            </Text>
            {score !== undefined && score > 0 && (
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>{score}% Match</Text>
              </View>
            )}
          </View>

          <Text style={styles.mentorRole} numberOfLines={1}>
            {mentor.jobTitle || 'Faculty Researcher'}
          </Text>

          {mentor.company ? (
            <Text style={styles.companyText} numberOfLines={1}>
              🏛 {mentor.company}
            </Text>
          ) : null}

          <Text style={styles.mentorExp}>
            ★ {mentor.rating ? mentor.rating.toFixed(1) : '4.9'} · Verified Mentor
          </Text>
        </View>
      </View>

      {/* Match Reasons or Expertise Tags */}
      {reasons && reasons.length > 0 ? (
        <View style={styles.reasonsContainer}>
          {reasons.map((reason, idx) => (
            <View key={idx} style={styles.reasonPill}>
              <Text style={styles.reasonText}>✓ {reason}</Text>
            </View>
          ))}
        </View>
      ) : mentor.expertise && mentor.expertise.length > 0 ? (
        <View style={styles.reasonsContainer}>
          {mentor.expertise.slice(0, 3).map((exp, idx) => (
            <View key={idx} style={styles.reasonPill}>
              <Text style={styles.reasonText}>• {exp}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Action Buttons Row */}
      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={[styles.profileBtn, isMentorUser && styles.profileBtnFull]}>
          <Text style={styles.profileBtnText}>View Profile</Text>
        </Pressable>

        {/* Booking action only visible to Students */}
        {!isMentorUser && (
          <Pressable
            accessibilityRole="button"
            onPress={onBook}
            style={styles.connectButton}>
            <Text style={styles.connectButtonText}>Book Session</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 18,
  },
  header: {
    marginTop: 8,
    gap: 6,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    color: '#111827',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleBadgeStudent: {
    backgroundColor: '#EEF2FF',
  },
  roleBadgeMentor: {
    backgroundColor: '#F3EEFF',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  roleBadgeTextStudent: {
    color: '#3B5DF6',
  },
  roleBadgeTextMentor: {
    color: '#7C3AED',
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
  },
  mentorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  mentorBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#6B21A8',
    lineHeight: 17,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F8',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },
  categorySection: {
    marginHorizontal: -20,
  },
  categoryTabsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F8',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryTabActive: {
    backgroundColor: '#3B5DF6',
    borderColor: '#3B5DF6',
  },
  categoryTabText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },
  categoryCountBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  categoryCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  categoryCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  categoryCountTextActive: {
    color: '#FFFFFF',
  },
  section: {
    gap: 12,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
  },
  matchCountBadge: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  matchesList: {
    gap: 14,
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F1F5',
    padding: 16,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.95,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EEF2FF',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '800',
    color: '#3B5DF6',
  },
  mentorInfo: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mentorName: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  scoreBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  scoreText: {
    color: '#3B5DF6',
    fontSize: 12,
    fontWeight: '800',
  },
  mentorRole: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '500',
  },
  companyText: {
    color: '#6B7280',
    fontSize: 12,
  },
  mentorExp: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  reasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reasonPill: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reasonText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  profileBtn: {
    flex: 1,
    backgroundColor: '#F3F4F8',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBtnFull: {
    flex: 1,
  },
  profileBtnText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  connectButton: {
    flex: 1,
    backgroundColor: '#3B5DF6',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    maxWidth: 280,
  },
});
