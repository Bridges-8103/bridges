import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ROUTES } from '@/constants/routes';
import { useRole } from '@/hooks/use-role';
import {
  useBookingsQuery,
  useUpdateBookingStatusMutation,
} from '@/services/sessions';
import type { BookingDto, BookingStatus } from '@/services/sessions/types';

function formatBookingTime(startTimeIso: string, endTimeIso: string): { dateStr: string; timeStr: string } {
  const start = new Date(startTimeIso);
  const end = new Date(endTimeIso);

  const dateStr = start.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const startTimeStr = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const endTimeStr = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return {
    dateStr,
    timeStr: `${startTimeStr} – ${endTimeStr}`,
  };
}

export default function SessionsScreen() {
  const router = useRouter();

  const { isMentor } = useRole();

  const {
    data: bookings = [],
    isLoading,
    isRefetching,
    refetch,
  } = useBookingsQuery(isMentor ? 'MENTOR' : 'STUDENT');

  const updateStatusMutation = useUpdateBookingStatusMutation();

  // Active filter tab
  const [mentorTab, setMentorTab] = useState<'pending' | 'confirmed' | 'all'>('pending');
  const [studentTab, setStudentTab] = useState<'all' | 'pending' | 'confirmed'>('all');

  // Filtered lists
  const pendingRequests = useMemo(
    () => bookings.filter((b) => b.status === 'PENDING'),
    [bookings]
  );

  const confirmedSessions = useMemo(
    () => bookings.filter((b) => b.status === 'CONFIRMED'),
    [bookings]
  );

  const displayedMentorBookings = useMemo(() => {
    if (mentorTab === 'pending') return pendingRequests;
    if (mentorTab === 'confirmed') return confirmedSessions;
    return bookings;
  }, [mentorTab, pendingRequests, confirmedSessions, bookings]);

  const displayedStudentBookings = useMemo(() => {
    if (studentTab === 'pending') return pendingRequests;
    if (studentTab === 'confirmed') return confirmedSessions;
    return bookings;
  }, [studentTab, pendingRequests, confirmedSessions, bookings]);

  // Mentor Actions: Confirm / Decline
  const handleConfirmSession = (booking: BookingDto) => {
    Alert.alert(
      'Accept Session Request',
      `Accept 30-min session with ${booking.student?.name || 'student'} for ${
        formatBookingTime(booking.slot.startTime, booking.slot.endTime).dateStr
      }?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept Session',
          style: 'default',
          onPress: async () => {
            try {
              await updateStatusMutation.mutateAsync({
                bookingId: booking.id,
                input: { status: 'CONFIRMED' },
              });
              Alert.alert('Session Confirmed! ✅', 'The student has been notified.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not confirm session.');
            }
          },
        },
      ]
    );
  };

  const handleDeclineSession = (booking: BookingDto) => {
    Alert.alert(
      'Decline Session Request',
      `Are you sure you want to decline this session request? The timeslot will automatically be reopened for other students.`,
      [
        { text: 'Keep Session', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateStatusMutation.mutateAsync({
                bookingId: booking.id,
                input: { status: 'DECLINED' },
              });
              Alert.alert('Session Declined', 'The slot is now available again.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not decline session.');
            }
          },
        },
      ]
    );
  };

  // Student Actions: Cancel
  const handleCancelBooking = (booking: BookingDto) => {
    Alert.alert(
      'Cancel Session Request',
      `Are you sure you want to cancel your session request with ${booking.mentor?.name || 'the mentor'}?`,
      [
        { text: 'No, Keep It', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateStatusMutation.mutateAsync({
                bookingId: booking.id,
                input: { status: 'CANCELLED' },
              });
              Alert.alert('Cancelled', 'Your session request has been cancelled.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not cancel session.');
            }
          },
        },
      ]
    );
  };

  const handleJoinCall = (booking: BookingDto) => {
    const link = booking.meetingLink || 'https://zoom.us/join';
    Linking.openURL(link).catch(() => {
      Alert.alert('Video Call', `Connecting to call: ${link}`);
    });
  };

  const renderStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <View style={[styles.statusBadge, styles.statusBadgePending]}>
            <Text style={styles.statusTextPending}>⏳ Pending Confirmation</Text>
          </View>
        );
      case 'CONFIRMED':
        return (
          <View style={[styles.statusBadge, styles.statusBadgeConfirmed]}>
            <Text style={styles.statusTextConfirmed}>✅ Confirmed</Text>
          </View>
        );
      case 'DECLINED':
        return (
          <View style={[styles.statusBadge, styles.statusBadgeDeclined]}>
            <Text style={styles.statusTextDeclined}>❌ Declined</Text>
          </View>
        );
      case 'CANCELLED':
        return (
          <View style={[styles.statusBadge, styles.statusBadgeCancelled]}>
            <Text style={styles.statusTextCancelled}>🚫 Cancelled</Text>
          </View>
        );
      case 'COMPLETED':
        return (
          <View style={[styles.statusBadge, styles.statusBadgeCompleted]}>
            <Text style={styles.statusTextCompleted}>🏁 Completed</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
        }>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.title}>
              {isMentor ? 'Student Mentorship Sessions' : 'My Booked Sessions'}
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
                {isMentor ? '🌟 Mentor Mode' : '🎓 Student Mode'}
              </Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            {isMentor
              ? 'Review and manage your incoming student mentorship bookings.'
              : 'Track your booked mentorship sessions and approvals.'}
          </Text>
        </View>

        {/* Mentor Availability Banner (Visible to mentors) */}
        {isMentor ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(ROUTES.MENTOR_AVAILABILITY)}
            style={({ pressed }) => [styles.mentorBannerCard, pressed && styles.pressed]}>
            <View style={styles.mentorBannerIconWrap}>
              <SymbolView
                name={{
                  ios: 'calendar.badge.clock',
                  android: 'event_available',
                  web: 'event_available',
                }}
                size={22}
                tintColor="#3B5DF6"
              />
            </View>
            <View style={styles.mentorBannerTextWrap}>
              <Text style={styles.mentorBannerTitle}>Manage Your Available Slots</Text>
              <Text style={styles.mentorBannerSubtitle}>
                Tick open 30-min windows for students to book
              </Text>
            </View>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={16}
              tintColor="#9CA3AF"
            />
          </Pressable>
        ) : null}

        {/* Filter Tabs */}
        {isMentor ? (
          <View style={styles.filterTabs}>
            <Pressable
              onPress={() => setMentorTab('pending')}
              style={[styles.tabButton, mentorTab === 'pending' && styles.tabButtonActive]}>
              <Text
                style={[
                  styles.tabButtonText,
                  mentorTab === 'pending' && styles.tabButtonTextActive,
                ]}>
                Pending Requests ({pendingRequests.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMentorTab('confirmed')}
              style={[styles.tabButton, mentorTab === 'confirmed' && styles.tabButtonActive]}>
              <Text
                style={[
                  styles.tabButtonText,
                  mentorTab === 'confirmed' && styles.tabButtonTextActive,
                ]}>
                Confirmed ({confirmedSessions.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMentorTab('all')}
              style={[styles.tabButton, mentorTab === 'all' && styles.tabButtonActive]}>
              <Text
                style={[styles.tabButtonText, mentorTab === 'all' && styles.tabButtonTextActive]}>
                All
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.filterTabs}>
            <Pressable
              onPress={() => setStudentTab('all')}
              style={[styles.tabButton, studentTab === 'all' && styles.tabButtonActive]}>
              <Text
                style={[styles.tabButtonText, studentTab === 'all' && styles.tabButtonTextActive]}>
                All ({bookings.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setStudentTab('pending')}
              style={[styles.tabButton, studentTab === 'pending' && styles.tabButtonActive]}>
              <Text
                style={[
                  styles.tabButtonText,
                  studentTab === 'pending' && styles.tabButtonTextActive,
                ]}>
                Pending ({pendingRequests.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setStudentTab('confirmed')}
              style={[styles.tabButton, studentTab === 'confirmed' && styles.tabButtonActive]}>
              <Text
                style={[
                  styles.tabButtonText,
                  studentTab === 'confirmed' && styles.tabButtonTextActive,
                ]}>
                Confirmed ({confirmedSessions.length})
              </Text>
            </Pressable>
          </View>
        )}

        {/* Loading State */}
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#3B5DF6" />
            <Text style={styles.loadingText}>Loading sessions…</Text>
          </View>
        ) : isMentor ? (
          /* MENTOR VIEW: INCOMING REQUESTS */
          displayedMentorBookings.length === 0 ? (
            <View style={styles.emptyCard}>
              <SymbolView
                name={{ ios: 'tray', android: 'inbox', web: 'inbox' }}
                size={36}
                tintColor="#9CA3AF"
              />
              <Text style={styles.emptyTitle}>
                {mentorTab === 'pending'
                  ? 'No pending requests'
                  : mentorTab === 'confirmed'
                  ? 'No upcoming confirmed sessions'
                  : 'No sessions yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {mentorTab === 'pending'
                  ? 'When students book your available slots, their session requests will appear here for you to accept or decline.'
                  : 'Configure more available slots to allow students to book mentorship sessions.'}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(ROUTES.MENTOR_AVAILABILITY)}
                style={styles.browseMentorsBtn}>
                <Text style={styles.browseMentorsBtnText}>Configure Available Slots</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.sessionList}>
              {displayedMentorBookings.map((booking) => {
                const { dateStr, timeStr } = formatBookingTime(
                  booking.slot.startTime,
                  booking.slot.endTime
                );

                return (
                  <View key={booking.id} style={styles.sessionCard}>
                    {/* Header: Student Info & Status */}
                    <View style={styles.cardHeader}>
                      {booking.student?.avatarUrl ? (
                        <Image
                          source={{ uri: booking.student.avatarUrl }}
                          style={styles.avatar}
                        />
                      ) : (
                        <View style={styles.avatarFallback}>
                          <Text style={styles.avatarInitial}>
                            {booking.student?.name?.charAt(0).toUpperCase() || 'S'}
                          </Text>
                        </View>
                      )}
                      <View style={styles.userMeta}>
                        <Text style={styles.userNameText}>
                          {booking.student?.name || 'Student'}
                        </Text>
                        <Text numberOfLines={1} style={styles.userSubText}>
                          {booking.student?.subtitle || 'Student Mentee'}
                        </Text>
                      </View>
                      {renderStatusBadge(booking.status)}
                    </View>

                    {/* Time & Duration */}
                    <View style={styles.timeBanner}>
                      <SymbolView
                        name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
                        size={16}
                        tintColor="#3B5DF6"
                      />
                      <Text style={styles.timeBannerText}>
                        {dateStr} · {timeStr} (30 min)
                      </Text>
                    </View>

                    {/* Topic to cover */}
                    <View style={styles.topicSection}>
                      <Text style={styles.topicLabel}>What they want to cover:</Text>
                      <Text style={styles.topicText}>{booking.topic}</Text>
                      {booking.notes ? (
                        <Text style={styles.notesText}>Notes: {booking.notes}</Text>
                      ) : null}
                    </View>

                    {/* Mentor Action Buttons */}
                    {booking.status === 'PENDING' ? (
                      <View style={styles.actionRow}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => handleDeclineSession(booking)}
                          disabled={updateStatusMutation.isPending}
                          style={({ pressed }) => [
                            styles.declineButton,
                            pressed && styles.pressed,
                          ]}>
                          <Text style={styles.declineButtonText}>Decline</Text>
                        </Pressable>

                        <Pressable
                          accessibilityRole="button"
                          onPress={() => handleConfirmSession(booking)}
                          disabled={updateStatusMutation.isPending}
                          style={({ pressed }) => [
                            styles.acceptButton,
                            pressed && styles.pressed,
                          ]}>
                          <Text style={styles.acceptButtonText}>Accept Session</Text>
                        </Pressable>
                      </View>
                    ) : booking.status === 'CONFIRMED' ? (
                      <View style={styles.actionRow}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => handleJoinCall(booking)}
                          style={({ pressed }) => [
                            styles.joinButton,
                            pressed && styles.pressed,
                          ]}>
                          <Text style={styles.joinButtonText}>Join Video Call</Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )
        ) : (
          /* STUDENT VIEW: BOOKED SESSIONS & STATUSES */
          displayedStudentBookings.length === 0 ? (
            <View style={styles.emptyCard}>
              <SymbolView
                name={{ ios: 'calendar.badge.exclamationmark', android: 'event', web: 'event' }}
                size={36}
                tintColor="#9CA3AF"
              />
              <Text style={styles.emptyTitle}>No sessions booked yet</Text>
              <Text style={styles.emptySubtitle}>
                Explore mentors, choose an available 30-min timeslot, and book your session!
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/explore')}
                style={styles.browseMentorsBtn}>
                <Text style={styles.browseMentorsBtnText}>Explore Mentors</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.sessionList}>
              {displayedStudentBookings.map((booking) => {
                const { dateStr, timeStr } = formatBookingTime(
                  booking.slot.startTime,
                  booking.slot.endTime
                );

                return (
                  <View key={booking.id} style={styles.sessionCard}>
                    {/* Header: Mentor Info & Status */}
                    <View style={styles.cardHeader}>
                      {booking.mentor?.avatarUrl ? (
                        <Image
                          source={{ uri: booking.mentor.avatarUrl }}
                          style={styles.avatar}
                        />
                      ) : (
                        <View style={styles.avatarFallback}>
                          <Text style={styles.avatarInitial}>
                            {booking.mentor?.name?.charAt(0).toUpperCase() || 'M'}
                          </Text>
                        </View>
                      )}
                      <View style={styles.userMeta}>
                        <Text style={styles.userNameText}>
                          {booking.mentor?.name || 'Mentor'}
                        </Text>
                        <Text numberOfLines={1} style={styles.userSubText}>
                          {booking.mentor?.subtitle || 'Mentor'}
                        </Text>
                      </View>
                      {renderStatusBadge(booking.status)}
                    </View>

                    {/* Time & Duration */}
                    <View style={styles.timeBanner}>
                      <SymbolView
                        name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
                        size={16}
                        tintColor="#3B5DF6"
                      />
                      <Text style={styles.timeBannerText}>
                        {dateStr} · {timeStr} (30 min)
                      </Text>
                    </View>

                    {/* Topic to cover */}
                    <View style={styles.topicSection}>
                      <Text style={styles.topicLabel}>Session Objective:</Text>
                      <Text style={styles.topicText}>{booking.topic}</Text>
                    </View>

                    {/* Student Actions */}
                    {booking.status === 'CONFIRMED' ? (
                      <View style={styles.actionRow}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => handleJoinCall(booking)}
                          style={({ pressed }) => [
                            styles.joinButton,
                            pressed && styles.pressed,
                          ]}>
                          <Text style={styles.joinButtonText}>Join Video Call</Text>
                        </Pressable>
                      </View>
                    ) : booking.status === 'PENDING' ? (
                      <View style={styles.actionRow}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => handleCancelBooking(booking)}
                          style={({ pressed }) => [
                            styles.cancelRequestBtn,
                            pressed && styles.pressed,
                          ]}>
                          <Text style={styles.cancelRequestBtnText}>Cancel Request</Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    marginTop: 8,
    gap: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
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
  title: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    flex: 1,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
  },
  mentorBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 12,
  },
  mentorBannerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mentorBannerTextWrap: {
    flex: 1,
  },
  mentorBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
  },
  mentorBannerSubtitle: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 2,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 4,
    borderRadius: 12,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabButtonTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  centerBox: {
    paddingVertical: 50,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 10,
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
    maxWidth: 260,
    lineHeight: 18,
  },
  browseMentorsBtn: {
    marginTop: 8,
    backgroundColor: '#3B5DF6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  browseMentorsBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sessionList: {
    gap: 14,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3B5DF6',
  },
  userMeta: {
    flex: 1,
  },
  userNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  userSubText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusTextPending: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  statusBadgeConfirmed: {
    backgroundColor: '#D1FAE5',
  },
  statusTextConfirmed: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  statusBadgeDeclined: {
    backgroundColor: '#FEE2E2',
  },
  statusTextDeclined: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
  },
  statusBadgeCancelled: {
    backgroundColor: '#F3F4F6',
  },
  statusTextCancelled: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  statusBadgeCompleted: {
    backgroundColor: '#E0E7FF',
  },
  statusTextCompleted: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3730A3',
  },
  timeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  timeBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  topicSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  topicLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  topicText: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  notesText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  declineButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  acceptButton: {
    flex: 2,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
  },
  acceptButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  joinButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B5DF6',
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelRequestBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  cancelRequestBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  pressed: {
    opacity: 0.8,
  },
});
