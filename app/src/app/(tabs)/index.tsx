import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { FieldCategoryCard } from '@/components/home/field-category-card';
import { MentorCard } from '@/components/home/mentor-card';
import { NextSessionCard } from '@/components/home/next-session-card';
import { SearchBar } from '@/components/home/search-bar';
import { mockFieldCategories, mockNextSession } from '@/data/mock-mentors';
import { useAuth } from '@/hooks/use-auth';
import { ROUTES } from '@/constants/routes';
import { useProfileQuery } from '@/services/profile/queries';
import { useSuggestedMentorsQuery, useMentorsQuery } from '@/services/mentors/queries';
import { useTaxonomyQuery } from '@/services/taxonomy/queries';

const CATEGORY_ICONS: Record<string, string> = {
  'tech-engineering': '💻',
  'health-medicine': '🩺',
  'science-environment': '🌱',
  'business-law': '📈',
  'education-society': '📚',
  'arts-design': '🎨',
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    data: profile,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
    isRefetching,
    isSuccess: isProfileSuccess,
  } = useProfileQuery();

  // Fetch real taxonomy categories from backend
  const { data: taxonomyCategories = [] } = useTaxonomyQuery();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const studentInterests = profile?.studentDetail?.interests ?? [];
  const hasInterests = studentInterests.length > 0;

  // Query interest-based suggested mentors from database
  const {
    data: suggestedMatches = [],
    isLoading: isSuggestionsLoading,
  } = useSuggestedMentorsQuery(studentInterests, 12);

  // If a category filter or search query is active, query filtered database mentors
  const isFiltering = Boolean(selectedCategory || searchQuery.trim());
  const {
    data: filteredResult,
    isLoading: isFilteredLoading,
  } = useMentorsQuery(
    isFiltering
      ? {
          category: selectedCategory ?? undefined,
          search: searchQuery.trim() || undefined,
          limit: 12,
        }
      : undefined,
    { enabled: isFiltering }
  );

  // Redirect to setup profile if first time
  useEffect(() => {
    if (isProfileSuccess && profile === null) {
      router.replace({
        pathname: ROUTES.MENTOR_PROFILE,
        params: { isNew: 'true' },
      });
    }
  }, [isProfileSuccess, profile, router]);

  const userName = profile?.displayName || user?.name || 'Friend';
  const userAvatar =
    profile?.avatarUrl ||
    user?.avatarUri ||
    'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=256&h=256&fit=crop&crop=faces';

  const displayCategories =
    taxonomyCategories.length > 0
      ? taxonomyCategories.map((c) => ({
          id: c.slug,
          title: c.name.split('&')[0].trim(),
          icon: CATEGORY_ICONS[c.slug] || '🎓',
        }))
      : mockFieldCategories;

  const handleSelectMentor = (mentorId: string) => {
    router.push(ROUTES.mentorDetail(mentorId));
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Top Greeting Header */}
        <View style={styles.headerRow}>
          <View style={styles.greetingTextContainer}>
            <Text style={styles.eyebrow}>Good morning,</Text>
            <Text style={styles.userName}>{userName} 👋</Text>
          </View>

          {/* User Avatar with Green Online Dot */}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(ROUTES.MENTOR_PROFILE)}
            style={styles.profileButton}>
            <Image source={{ uri: userAvatar }} style={styles.profileAvatar} />
            <View style={styles.onlineBadge} />
          </Pressable>
        </View>

        {/* Display card if API call to profile is error */}
        {isProfileError && (
          <View style={styles.errorCard}>
            <View style={styles.errorCardHeader}>
              <SymbolView
                name={{ ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' }}
                size={18}
                tintColor="#DC2626"
              />
              <Text style={styles.errorCardTitle}>Cannot fetch profile</Text>
            </View>
            <Text style={styles.errorCardText}>
              {profileError?.message ||
                'Unable to retrieve your profile information. Please check your connection and try again.'}
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={isRefetching}
              onPress={() => refetchProfile()}
              style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
              <Text style={styles.retryButtonText}>{isRefetching ? 'Retrying…' : 'Retry'}</Text>
            </Pressable>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        {/* Next Session Banner Card */}
        <View style={styles.bannerSection}>
          <NextSessionCard session={mockNextSession} />
        </View>

        {/* Browse by Field Section (backed by live Taxonomy) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Browse by field</Text>
          <Pressable
            onPress={() => {
              setSelectedCategory(null);
              router.push('/explore');
            }}>
            <Text style={styles.sectionAction}>All</Text>
          </Pressable>
        </View>

        <View style={styles.categoriesRow}>
          {displayCategories.map((category) => (
            <FieldCategoryCard
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.id}
              onPress={() => {
                setSelectedCategory(
                  selectedCategory === category.id ? null : category.id
                );
              }}
            />
          ))}
        </View>

        {/* Suggested Mentors Section (Replaces old Top Mentors) */}
        <View style={[styles.sectionHeader, styles.topMentorsHeader]}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Suggested mentors</Text>
            {hasInterests && !isFiltering && (
              <View style={styles.sparkleBadge}>
                <SymbolView
                  name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
                  size={12}
                  tintColor="#3B5DF6"
                />
                <Text style={styles.sparkleBadgeText}>For your interests</Text>
              </View>
            )}
          </View>
          <Pressable onPress={() => router.push('/explore')}>
            <Text style={styles.sectionAction}>See all</Text>
          </Pressable>
        </View>

        {/* Callout to add interests if student has none */}
        {!hasInterests && !isFiltering && (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: ROUTES.SELECT_TAGS,
                params: { field: 'interests' },
              })
            }
            style={({ pressed }) => [styles.personalizeCallout, pressed && styles.pressed]}>
            <View style={styles.calloutIconWrap}>
              <Text style={{ fontSize: 22 }}>💡</Text>
            </View>
            <View style={styles.calloutTextWrap}>
              <Text style={styles.calloutTitle}>Personalize your suggestions</Text>
              <Text style={styles.calloutSubtitle}>
                Add your research interests to match with university mentors in your field.
              </Text>
            </View>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={14}
              tintColor="#3B5DF6"
            />
          </Pressable>
        )}

        {/* Mentors Horizontal Carousel */}
        {isFiltering ? (
          isFilteredLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#3B5DF6" />
              <Text style={styles.loadingText}>Filtering mentors…</Text>
            </View>
          ) : filteredResult && filteredResult.items.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mentorsScroll}>
              {filteredResult.items.map((mentor) => (
                <MentorCard
                  key={mentor.id}
                  mentor={mentor}
                  onPress={() => handleSelectMentor(mentor.id)}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No mentors match your selected filter.</Text>
            </View>
          )
        ) : isSuggestionsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#3B5DF6" />
            <Text style={styles.loadingText}>Finding suggested mentors…</Text>
          </View>
        ) : suggestedMatches.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mentorsScroll}>
            {suggestedMatches.map((match) => (
              <MentorCard
                key={match.mentor.id}
                mentor={match.mentor}
                score={hasInterests ? match.score : undefined}
                matchReason={match.matchReasons[0]}
                onPress={() => handleSelectMentor(match.mentor.id)}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No mentors found.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  greetingTextContainer: {
    gap: 4,
  },
  eyebrow: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  userName: {
    color: '#111827',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  profileButton: {
    position: 'relative',
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
  },
  onlineBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  searchSection: {
    marginTop: 2,
  },
  bannerSection: {
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sparkleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  sparkleBadgeText: {
    color: '#3B5DF6',
    fontSize: 11,
    fontWeight: '700',
  },
  topMentorsHeader: {
    marginTop: 6,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionAction: {
    color: '#3B5DF6',
    fontSize: 14,
    fontWeight: '700',
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  personalizeCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FE',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  calloutIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutTextWrap: {
    flex: 1,
    gap: 2,
  },
  calloutTitle: {
    color: '#1E3A8A',
    fontSize: 14,
    fontWeight: '700',
  },
  calloutSubtitle: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 16,
  },
  mentorsScroll: {
    gap: 14,
    paddingRight: 8,
    paddingBottom: 8,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 13,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    marginTop: 6,
  },
  errorCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorCardTitle: {
    color: '#991B1B',
    fontSize: 15,
    fontWeight: '700',
  },
  errorCardText: {
    color: '#7F1D1D',
    fontSize: 13,
    lineHeight: 18,
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#DC2626',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    marginTop: 2,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});
