import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useRole } from '@/hooks/use-role';
import { useMentorDetailQuery } from '@/services/mentors/queries';
import { useProfileQuery } from '@/services/profile/queries';
import { ROUTES } from '@/constants/routes';

export default function MentorDetailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isMentor } = useRole();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: mentor, isLoading, isError, refetch } = useMentorDetailQuery(id ?? '');
  const { data: profile } = useProfileQuery();

  const studentInterests = profile?.studentDetail?.interests ?? [];

  const handleShare = async () => {
    if (!mentor) return;
    try {
      await Share.share({
        title: mentor.name,
        message: `Connect with ${mentor.name} (${mentor.jobTitle ?? 'Mentor'} at ${
          mentor.company ?? 'Bridges'
        }) on Bridges.`,
      });
    } catch {
      // User dismissed share
    }
  };

  const handleBookSession = () => {
    if (!mentor) return;
    if (isMentor) {
      Alert.alert(
        'Booking Unavailable',
        'As a mentor, you can view peer profiles and network with colleagues, but session bookings are reserved for students.'
      );
      return;
    }
    router.push(ROUTES.mentorBook(mentor.id));
  };

  const handleOpenEmail = () => {
    if (mentor?.email || mentor?.contactEmail) {
      const email = mentor.contactEmail || mentor.email;
      Linking.openURL(`mailto:${email}?subject=Mentorship%20Inquiry%20via%20Bridges`).catch(() => {
        Alert.alert('Email', `Contact ${mentor.name} at: ${email}`);
      });
    }
  };

  const handleOpenLinkedIn = () => {
    if (mentor?.linkedinUrl) {
      const url = mentor.linkedinUrl.startsWith('http')
        ? mentor.linkedinUrl
        : `https://${mentor.linkedinUrl}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('LinkedIn', url);
      });
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#3B5DF6" />
        <ThemedText style={styles.loadingText}>Loading mentor profile…</ThemedText>
      </View>
    );
  }

  if (isError || !mentor) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <SymbolView
          name={{ ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' }}
          size={36}
          tintColor="#DC2626"
        />
        <ThemedText style={styles.errorTitle}>Mentor Not Found</ThemedText>
        <ThemedText style={styles.errorSubtitle}>
          We could not load details for this mentor. They may have updated their profile.
        </ThemedText>
        <View style={styles.errorActionRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.backButtonOutline}>
            <Text style={styles.backButtonOutlineText}>Go Back</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => refetch()}
            style={styles.retryButtonPrimary}>
            <Text style={styles.retryButtonPrimaryText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const initials = mentor.name
    .split(' ')
    .filter((part) => !part.includes('.'))
    .slice(0, 2)
    .map((p) => p.charAt(0))
    .join('')
    .toUpperCase();

  const matchingTags = mentor.expertise.filter((skill) =>
    studentInterests.some(
      (interest) =>
        skill.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(skill.toLowerCase())
    )
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Navigation Bar */}
      <View style={[styles.navBar, { borderBottomColor: theme.border }]}>
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => router.back()}
          style={styles.navIconBtn}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'chevron_left' }}
            size={20}
            tintColor="#111827"
          />
        </Pressable>

        <Text style={styles.navTitle} numberOfLines={1}>
          Mentor Profile
        </Text>

        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={handleShare}
          style={styles.navIconBtn}>
          <SymbolView
            name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
            size={18}
            tintColor="#111827"
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Mentor Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.heroTop}>
            {mentor.avatarUrl ? (
              <Image source={{ uri: mentor.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>{initials || 'ME'}</Text>
              </View>
            )}

            <View style={styles.heroMeta}>
              <View style={styles.nameRow}>
                <Text style={styles.mentorName}>{mentor.name}</Text>
                <View style={styles.verifiedBadge}>
                  <SymbolView
                    name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }}
                    size={16}
                    tintColor="#3B5DF6"
                  />
                </View>
              </View>

              {mentor.jobTitle ? (
                <Text style={styles.jobTitle}>{mentor.jobTitle}</Text>
              ) : null}

              {mentor.company ? (
                <Text style={styles.companyName}>🏛 {mentor.company}</Text>
              ) : null}

              {mentor.industry ? (
                <Text style={styles.departmentName}>📍 {mentor.industry}</Text>
              ) : null}
            </View>
          </View>

          {/* Quick Metrics Pills */}
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statIcon}>★</Text>
              <Text style={styles.statText}>{mentor.rating.toFixed(1)} Rating</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statIcon}>🎓</Text>
              <Text style={styles.statText}>Verified Faculty</Text>
            </View>
            {matchingTags.length > 0 && (
              <View style={[styles.statPill, styles.statMatchPill]}>
                <Text style={styles.statMatchText}>
                  🎯 {matchingTags.length} Interest {matchingTags.length === 1 ? 'Match' : 'Matches'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* About Section */}
        {mentor.bio ? (
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={styles.sectionHeading}>About & Research</Text>
            <Text style={styles.bioText}>{mentor.bio}</Text>
          </View>
        ) : null}

        {/* Areas of Mentorship & Expertise */}
        {mentor.expertise.length > 0 ? (
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Mentorship Expertise</Text>
              <Text style={styles.tagCountBadge}>{mentor.expertise.length} Topics</Text>
            </View>

            <View style={styles.tagsContainer}>
              {mentor.expertise.map((skill, index) => {
                const isMatched = studentInterests.some(
                  (interest) =>
                    skill.toLowerCase().includes(interest.toLowerCase()) ||
                    interest.toLowerCase().includes(skill.toLowerCase())
                );
                return (
                  <View
                    key={index}
                    style={[
                      styles.skillChip,
                      isMatched && styles.matchedChip,
                    ]}>
                    {isMatched && (
                      <SymbolView
                        name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
                        size={12}
                        tintColor="#3B5DF6"
                      />
                    )}
                    <Text style={[styles.skillChipText, isMatched && styles.matchedChipText]}>
                      {skill}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Preferred Enquiries */}
        {mentor.preferredEnquiries.length > 0 ? (
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={styles.sectionHeading}>Preferred Enquiries</Text>
            <View style={styles.enquiriesList}>
              {mentor.preferredEnquiries.map((enquiry, idx) => (
                <View key={idx} style={styles.enquiryRow}>
                  <SymbolView
                    name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                    size={16}
                    tintColor="#10B981"
                  />
                  <Text style={styles.enquiryText}>{enquiry}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Contact & Professional Links */}
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={styles.sectionHeading}>Contact & Profiles</Text>

          <View style={styles.contactList}>
            {(mentor.contactEmail || mentor.email) && (
              <Pressable
                accessibilityRole="button"
                onPress={handleOpenEmail}
                style={({ pressed }) => [styles.contactItem, pressed && styles.pressed]}>
                <View style={[styles.contactIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <SymbolView
                    name={{ ios: 'envelope.fill', android: 'mail', web: 'mail' }}
                    size={18}
                    tintColor="#3B5DF6"
                  />
                </View>
                <View style={styles.contactTextWrap}>
                  <Text style={styles.contactLabel}>Email Address</Text>
                  <Text style={styles.contactValue} numberOfLines={1}>
                    {mentor.contactEmail || mentor.email}
                  </Text>
                </View>
                <SymbolView
                  name={{ ios: 'arrow.up.right', android: 'open_in_new', web: 'open_in_new' }}
                  size={14}
                  tintColor="#9CA3AF"
                />
              </Pressable>
            )}

            {mentor.linkedinUrl && (
              <Pressable
                accessibilityRole="button"
                onPress={handleOpenLinkedIn}
                style={({ pressed }) => [styles.contactItem, pressed && styles.pressed]}>
                <View style={[styles.contactIconWrap, { backgroundColor: '#F5F3FF' }]}>
                  <SymbolView
                    name={{ ios: 'link', android: 'link', web: 'link' }}
                    size={18}
                    tintColor="#7C3AED"
                  />
                </View>
                <View style={styles.contactTextWrap}>
                  <Text style={styles.contactLabel}>LinkedIn Profile</Text>
                  <Text style={styles.contactValue} numberOfLines={1}>
                    View Professional Profile
                  </Text>
                </View>
                <SymbolView
                  name={{ ios: 'arrow.up.right', android: 'open_in_new', web: 'open_in_new' }}
                  size={14}
                  tintColor="#9CA3AF"
                />
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        {isMentor ? (
          <View style={styles.mentorBottomContainer}>
            <View style={styles.mentorNoticeRow}>
              <SymbolView
                name={{ ios: 'info.circle.fill', android: 'info', web: 'info' }}
                size={14}
                tintColor="#7C3AED"
              />
              <Text style={styles.mentorNoticeText}>
                Mentorship booking is reserved for student accounts.
              </Text>
            </View>
            <View style={styles.mentorActionButtonsRow}>
              {(mentor.contactEmail || mentor.email) && (
                <Pressable
                  accessibilityRole="button"
                  onPress={handleOpenEmail}
                  style={({ pressed }) => [
                    styles.mentorEmailButton,
                    pressed && styles.pressed,
                  ]}>
                  <SymbolView
                    name={{ ios: 'envelope.fill', android: 'mail', web: 'mail' }}
                    size={16}
                    tintColor="#3B5DF6"
                  />
                  <Text style={styles.mentorEmailButtonText}>Email Colleague</Text>
                </Pressable>
              )}
              <Pressable
                accessibilityRole="button"
                onPress={handleShare}
                style={({ pressed }) => [
                  styles.mentorShareButton,
                  pressed && styles.pressed,
                ]}>
                <SymbolView
                  name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
                  size={16}
                  tintColor="#4B5563"
                />
                <Text style={styles.mentorShareButtonText}>Share Profile</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={handleBookSession}
            style={({ pressed }) => [
              styles.bookButton,
              pressed && styles.pressed,
            ]}>
            <SymbolView
              name={{
                ios: 'calendar.badge.plus',
                android: 'event',
                web: 'event',
              }}
              size={18}
              tintColor="#FFFFFF"
            />
            <Text style={styles.bookButtonText}>Book Mentorship Session</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 280,
  },
  errorActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  backButtonOutline: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  backButtonOutlineText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },
  retryButtonPrimary: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#3B5DF6',
  },
  retryButtonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTop: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#EEF2FF',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: '800',
    color: '#3B5DF6',
  },
  heroMeta: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  mentorName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  verifiedBadge: {
    marginTop: 1,
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  companyName: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  departmentName: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statIcon: {
    color: '#F59E0B',
    fontSize: 12,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  statMatchPill: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D7FF',
  },
  statMatchText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B5DF6',
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  tagCountBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  bioText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4B5563',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3F4F8',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  skillChipText: {
    fontSize: 13,
    color: '#374151',
  },
  matchedChip: {
    backgroundColor: '#EEF2FF',
    borderColor: '#3B5DF6',
  },
  matchedChipText: {
    color: '#3B5DF6',
    fontWeight: '700',
  },
  enquiriesList: {
    gap: 10,
  },
  enquiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  enquiryText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  contactList: {
    gap: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  contactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTextWrap: {
    flex: 1,
    gap: 2,
  },
  contactLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  contactValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B5DF6',
    paddingVertical: 14,
    borderRadius: 16,
  },
  bookButtonDisabled: {
    backgroundColor: '#10B981',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  mentorBottomContainer: {
    gap: 8,
  },
  mentorNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FAF5FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  mentorNoticeText: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '600',
  },
  mentorActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mentorEmailButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 12,
    borderRadius: 14,
  },
  mentorEmailButtonText: {
    color: '#3B5DF6',
    fontSize: 14,
    fontWeight: '700',
  },
  mentorShareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 14,
  },
  mentorShareButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
});
