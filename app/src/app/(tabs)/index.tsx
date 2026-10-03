import React, { useState } from 'react';
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
import { mockFieldCategories } from '@/data/mock-mentors';
import { ROUTES } from '@/constants/routes';
import { useRole } from '@/hooks/use-role';
import { useSuggestedMentorsQuery, useMentorsQuery } from '@/services/mentors/queries';
import { useTaxonomyQuery } from '@/services/taxonomy/queries';
import { useBookingsQuery } from '@/services/sessions/queries';

const CATEGORY_ICONS: Record<string, string> = {
  'tech-engineering': '💻',
  'health-medicine': '🩺',
  'science-environment': '🌱',
  'business-law': '📈',
  'education-society': '📚',
  'arts-design': '🎨',
};

function formatNextSessionDate(startTimeIso: string): string {
  const d = new Date(startTimeIso);
  const dateStr = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${dateStr} · ${timeStr}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, profile, isMentor, isStudent } = useRole();

  // Fetch real taxonomy categories from backend
  const { data: taxonomyCategories = [] } = useTaxonomyQuery();

  // Fetch bookings based on active role
  const { data: bookings = [] } = useBookingsQuery(isMentor ? 'MENTOR' : 'STUDENT');

  const pendingMentorRequests = isMentor ? bookings.filter((b) => b.status === 'PENDING') : [];
  const confirmedSessions = bookings.filter((b) => b.status === 'CONFIRMED');
  const nextSession = confirmedSessions[0];

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const studentInterests = profile?.studentDetail?.interests ?? [];
  const hasInterests = studentInterests.length > 0;

  // Query interest-based suggested mentors from database
  const {
    data: suggestedMatches = [],
    isLoading: isSuggestionsLoading,
  } = useSuggestedMentorsQuery(studentInterests, 12);

  // If a category filter is active, query filtered database mentors
  const isFiltering = Boolean(selectedCategory);
  const {
    data: filteredResult,
    isLoading: isFilteredLoading,
  } = useMentorsQuery(
    isFiltering
      ? {
          category: selectedCategory ?? undefined,
          limit: 12,
        }
      : undefined,
    { enabled: isFiltering }
  );

  const userName = profile?.displayName || user?.name || (isMentor ? 'Mentor' : 'Student');
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
            <View style={styles.eyebrowRow}>
              <Text style={styles.eyebrow}>Good morning,</Text>
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
                  {isMentor ? '🌟 Mentor' : '🎓 Student'}
                </Text>
              </View>
            </View>
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

        {/* MENTOR ROLE: INCOMING STUDENT REQUESTS & SHORTCUTS */}
        {isMentor && (
          <View style={styles.mentorHubContainer}>
            {/* Pending Requests Alert */}
            {pendingMentorRequests.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(tabs)/sessions')}
                style={({ pressed }) => [styles.pendingAlertCard, pressed && styles.pressed]}>
                <View style={styles.pendingAlertIconWrap}>
                  <SymbolView
                    name={{ ios: 'bell.badge.fill', android: 'notifications', web: 'notifications' }}
                    size={22}
                    tintColor="#D97706"
                  />
                </View>
                <View style={styles.pendingAlertContent}>
                  <Text style={styles.pendingAlertTitle}>
                    {pendingMentorRequests.length} Student {pendingMentorRequests.length === 1 ? 'Request' : 'Requests'} Waiting
                  </Text>
                  <Text style={styles.pendingAlertSub}>
                    Students have booked session slots with you. Tap to review and accept.
                  </Text>
                </View>
                <SymbolView
                  name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                  size={16}
                  tintColor="#D97706"
                />
              </Pressable>
            ) : null}

            {/* Upcoming confirmed session if any */}
            {nextSession ? (
              <View style={styles.nextSessionCardMentor}>
                <View style={styles.nextSessionHeader}>
                  <View style={styles.nextSessionPill}>
                    <Text style={styles.nextSessionPillText}>Next Student Mentorship</Text>
                  </View>
                  <Text style={styles.nextSessionDate}>
                    {formatNextSessionDate(nextSession.slot.startTime)}
                  </Text>
                </View>
                <Text style={styles.nextSessionStudentName}>
                  Mentee: {nextSession.student?.name || 'Student'}
                </Text>
                <Text numberOfLines={2} style={styles.nextSessionTopic}>
                  Topic: {nextSession.topic}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/(tabs)/sessions')}
                  style={styles.nextSessionActionBtn}>
                  <Text style={styles.nextSessionActionBtnText}>Manage in Sessions</Text>
                </Pressable>
              </View>
            ) : null}

            {/* Quick Actions Hub for Mentors */}
            <View style={styles.mentorQuickActionsRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(ROUTES.MENTOR_AVAILABILITY)}
                style={({ pressed }) => [styles.mentorQuickCard, pressed && styles.pressed]}>
                <View style={[styles.mentorQuickIcon, { backgroundColor: '#EFF6FF' }]}>
                  <SymbolView
                    name={{
                      ios: 'calendar.badge.clock',
                      android: 'event_available',
                      web: 'event_available',
                    }}
                    size={20}
                    tintColor="#3B5DF6"
                  />
                </View>
                <Text style={styles.mentorQuickTitle}>Set Availability</Text>
                <Text style={styles.mentorQuickSub}>Manage 30-min booking slots</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(tabs)/sessions')}
                style={({ pressed }) => [styles.mentorQuickCard, pressed && styles.pressed]}>
                <View style={[styles.mentorQuickIcon, { backgroundColor: '#F3EEFF' }]}>
                  <SymbolView
                    name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
                    size={20}
                    tintColor="#7C3AED"
                  />
                </View>
                <Text style={styles.mentorQuickTitle}>Student Sessions</Text>
                <Text style={styles.mentorQuickSub}>
                  {bookings.length} total scheduled
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* STUDENT ROLE: UPCOMING SESSION HIGHLIGHT */}
        {isStudent && nextSession && (
          <View style={styles.nextSessionCardStudent}>
            <View style={styles.nextSessionHeader}>
              <View style={styles.nextSessionPillStudent}>
                <Text style={styles.nextSessionPillTextStudent}>Upcoming Mentorship</Text>
              </View>
              <Text style={styles.nextSessionDateStudent}>
                {formatNextSessionDate(nextSession.slot.startTime)}
              </Text>
            </View>
            <Text style={styles.nextSessionStudentName}>
              Mentor: {nextSession.mentor?.name || 'Mentor'}
            </Text>
            <Text numberOfLines={1} style={styles.nextSessionTopic}>
              {nextSession.topic}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(tabs)/sessions')}
              style={styles.nextSessionStudentBtn}>
              <Text style={styles.nextSessionStudentBtnText}>View in My Sessions</Text>
            </Pressable>
          </View>
        )}

        {/* Section: Browse by Field */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isMentor ? 'Browse academic fields' : 'Browse by field'}
          </Text>
          <Pressable
            onPress={() => {
              setSelectedCategory(null);
              router.push('/explore');
            }}>
            <Text style={styles.sectionAction}>All</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesScroll}>
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
        </ScrollView>

        {/* Section: Suggested Mentors (Students) or Colleague Network (Mentors) */}
        <View style={[styles.sectionHeader, styles.topMentorsHeader]}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>
              {isMentor ? 'Faculty & Colleague Network' : 'Suggested mentors'}
            </Text>
            {isStudent && hasInterests && !isFiltering && (
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

        {/* Student-only Callout to personalize interests */}
        {isStudent && !hasInterests && !isFiltering && (
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

        {/* Mentor notice banner: mentors can view peers, but bookings are for students */}
        {isMentor && !isFiltering && (
          <View style={styles.mentorNetworkNotice}>
            <SymbolView
              name={{ ios: 'info.circle.fill', android: 'info', web: 'info' }}
              size={16}
              tintColor="#7C3AED"
            />
            <Text style={styles.mentorNetworkNoticeText}>
              Explore peer researchers and mentors across university departments. Mentorship bookings are reserved for student accounts.
            </Text>
          </View>
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
                score={isStudent && hasInterests ? match.score : undefined}
                matchReason={isStudent ? match.matchReasons[0] : 'Faculty Colleague'}
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
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyebrow: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
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
  mentorHubContainer: {
    gap: 12,
  },
  pendingAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  pendingAlertIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingAlertContent: {
    flex: 1,
    gap: 2,
  },
  pendingAlertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  pendingAlertSub: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
  },
  nextSessionCardMentor: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  nextSessionCardStudent: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  nextSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextSessionPill: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  nextSessionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nextSessionPillStudent: {
    backgroundColor: '#3B5DF6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  nextSessionPillTextStudent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nextSessionDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B21A8',
  },
  nextSessionDateStudent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  nextSessionStudentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  nextSessionTopic: {
    fontSize: 13,
    color: '#4B5563',
  },
  nextSessionActionBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  nextSessionActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  nextSessionStudentBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#3B5DF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  nextSessionStudentBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  mentorQuickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mentorQuickCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  mentorQuickIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  mentorQuickTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  mentorQuickSub: {
    fontSize: 11,
    color: '#6B7280',
  },
  categoriesContainer: {
    marginHorizontal: -20,
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    gap: 10,
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
  mentorNetworkNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  mentorNetworkNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#6B21A8',
    lineHeight: 17,
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
  pressed: {
    opacity: 0.85,
  },
});
