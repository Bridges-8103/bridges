import React, { useMemo, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useRole } from '@/hooks/use-role';
import { useMentorDetailQuery } from '@/services/mentors/queries';
import { useMentorAvailableSlotsQuery } from '@/services/sessions/queries';
import type { SlotDto } from '@/services/sessions/types';

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getNextDays(count = 14): Date[] {
  const list: Date[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    d.setHours(0, 0, 0, 0);
    list.push(d);
  }
  return list;
}

function formatSlotTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function BookMentorSessionsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isMentor } = useRole();

  const { data: mentor, isLoading: isMentorLoading } = useMentorDetailQuery(id ?? '');
  const { data: availableSlots = [], isLoading: isSlotsLoading } =
    useMentorAvailableSlotsQuery(id ?? '');

  const daysList = useMemo(() => getNextDays(14), []);
  const [selectedDate, setSelectedDate] = useState<Date>(daysList[0]);
  const activeDateKey = toDateKey(selectedDate);

  // Set of selected slot IDs
  const [selectedSlotIds, setSelectedSlotIds] = useState<number[]>([]);

  // Group slots by dateKey
  const slotsByDate = useMemo(() => {
    const map = new Map<string, SlotDto[]>();
    for (const slot of availableSlots) {
      const d = new Date(slot.startTime);
      const k = toDateKey(d);
      const list = map.get(k) || [];
      list.push(slot);
      map.set(k, list);
    }
    return map;
  }, [availableSlots]);

  const activeDaySlots = slotsByDate.get(activeDateKey) || [];

  const toggleSlotSelection = (slotId: number) => {
    setSelectedSlotIds((prev) =>
      prev.includes(slotId) ? prev.filter((s) => s !== slotId) : [...prev, slotId]
    );
  };

  const handleProceedToConfirmation = () => {
    if (selectedSlotIds.length === 0 || !id) return;
    router.push({
      pathname: '/mentor/[id]/confirm-booking',
      params: { id, slotIds: selectedSlotIds.join(',') },
    });
  };

  const selectedCount = selectedSlotIds.length;

  if (isMentor) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.backButton}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              size={20}
              tintColor="#111827"
            />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.title}>Booking Unavailable</Text>
            <Text numberOfLines={1} style={styles.subtitle}>
              Reserved for students
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.mentorBlockedBox}>
          <View style={styles.mentorBlockedIconWrap}>
            <SymbolView
              name={{ ios: 'lock.circle.fill', android: 'lock', web: 'lock' }}
              size={48}
              tintColor="#7C3AED"
            />
          </View>
          <Text style={styles.mentorBlockedTitle}>Booking Reserved for Students</Text>
          <Text style={styles.mentorBlockedText}>
            You are signed in as a Mentor. Mentors can view peer profiles and receive mentorship requests from students, but cannot book sessions.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.goBackPrimaryBtn}>
            <Text style={styles.goBackPrimaryBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* Top Navigation */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backButton}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            size={20}
            tintColor="#111827"
          />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>Book Mentorship</Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            with {mentor?.name || 'Mentor'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Mentor Mini Profile Header */}
      {mentor ? (
        <View style={styles.mentorMiniCard}>
          {mentor.avatarUrl ? (
            <Image source={{ uri: mentor.avatarUrl }} style={styles.mentorAvatar} />
          ) : (
            <View style={styles.mentorAvatarFallback}>
              <Text style={styles.avatarInitials}>
                {mentor.name.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.mentorInfo}>
            <Text style={styles.mentorNameText}>{mentor.name}</Text>
            <Text numberOfLines={1} style={styles.mentorJobText}>
              {mentor.jobTitle || 'Mentor'}
              {mentor.company ? ` · ${mentor.company}` : ''}
            </Text>
            <View style={styles.slotDurationPill}>
              <Text style={styles.slotDurationText}>⚡ 30 min per session</Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* Date Carousel */}
      <View style={styles.dateStripWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateStripContent}>
          {daysList.map((day, idx) => {
            const key = toDateKey(day);
            const isSelected = key === activeDateKey;
            const dayName = idx === 0 ? 'Today' : day.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = day.getDate();
            const hasAvailableSlots = (slotsByDate.get(key) || []).length > 0;

            return (
              <Pressable
                key={key}
                onPress={() => setSelectedDate(day)}
                style={[styles.dateChip, isSelected && styles.dateChipSelected]}>
                <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                  {dayName}
                </Text>
                <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>
                  {dayNum}
                </Text>
                {hasAvailableSlots ? (
                  <View style={[styles.dotIndicator, isSelected && styles.dotIndicatorSelected]} />
                ) : (
                  <View style={styles.dotPlaceholder} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Slots Section */}
      <ScrollView contentContainerStyle={styles.slotsScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.slotsSectionHeader}>
          <Text style={styles.sectionDateText}>
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.sectionAvailabilityText}>
            {activeDaySlots.length} available {activeDaySlots.length === 1 ? 'slot' : 'slots'}
          </Text>
        </View>

        {isSlotsLoading || isMentorLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color="#3B5DF6" />
            <Text style={styles.loadingText}>Fetching available timeslots…</Text>
          </View>
        ) : activeDaySlots.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <SymbolView
              name={{ ios: 'calendar.badge.clock', android: 'event_busy', web: 'event_busy' }}
              size={36}
              tintColor="#9CA3AF"
            />
            <Text style={styles.emptyTitle}>No open slots on this date</Text>
            <Text style={styles.emptySubtitle}>
              Please select another date on the calendar above or check back later.
            </Text>
          </View>
        ) : (
          <View style={styles.slotsList}>
            {activeDaySlots.map((slot) => {
              const isSelected = selectedSlotIds.includes(slot.id);
              const startStr = formatSlotTime(slot.startTime);
              const endStr = formatSlotTime(slot.endTime);

              return (
                <Pressable
                  key={slot.id}
                  onPress={() => toggleSlotSelection(slot.id)}
                  style={[
                    styles.slotCard,
                    isSelected && styles.slotCardSelected,
                  ]}>
                  <View style={styles.slotTimeRow}>
                    <SymbolView
                      name={{
                        ios: isSelected ? 'checkmark.circle.fill' : 'clock',
                        android: isSelected ? 'check_circle' : 'schedule',
                        web: isSelected ? 'check_circle' : 'schedule',
                      }}
                      size={20}
                      tintColor={isSelected ? '#3B5DF6' : '#6B7280'}
                    />
                    <Text
                      style={[
                        styles.slotTimeText,
                        isSelected && styles.slotTimeTextSelected,
                      ]}>
                      {startStr} – {endStr}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.selectButtonBadge,
                      isSelected && styles.selectButtonBadgeSelected,
                    ]}>
                    <Text
                      style={[
                        styles.selectButtonText,
                        isSelected && styles.selectButtonTextSelected,
                      ]}>
                      {isSelected ? 'Selected' : 'Select'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Review Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInfo}>
          <Text style={styles.selectedCountText}>
            {selectedCount === 0
              ? 'Select 1 or more slots'
              : `${selectedCount} ${selectedCount === 1 ? 'session' : 'sessions'} (${selectedCount * 30} min)`}
          </Text>
          <Text style={styles.selectedSubText}>
            {selectedCount > 0 ? 'Multiple sessions allowed' : 'Exclusive 1-on-1 slot'}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={selectedCount === 0}
          onPress={handleProceedToConfirmation}
          style={({ pressed }) => [
            styles.continueButton,
            selectedCount === 0 && styles.continueButtonDisabled,
            pressed && styles.pressed,
          ]}>
          <Text style={styles.continueButtonText}>
            Review ({selectedCount})
          </Text>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'arrow_forward', web: 'arrow_forward' }}
            size={16}
            tintColor="#FFFFFF"
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    maxWidth: 200,
  },
  mentorMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  mentorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  mentorAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#3B5DF6',
    fontSize: 16,
    fontWeight: '800',
  },
  mentorInfo: {
    flex: 1,
    gap: 2,
  },
  mentorNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  mentorJobText: {
    fontSize: 12,
    color: '#6B7280',
  },
  slotDurationPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  slotDurationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B5DF6',
  },
  dateStripWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
  },
  dateStripContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dateChip: {
    width: 64,
    height: 72,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 3,
  },
  dateChipSelected: {
    backgroundColor: '#3B5DF6',
    borderColor: '#3B5DF6',
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  dayNameSelected: {
    color: '#FFFFFF',
  },
  dayNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  dayNumSelected: {
    color: '#FFFFFF',
  },
  dotIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  dotIndicatorSelected: {
    backgroundColor: '#FFFFFF',
  },
  dotPlaceholder: {
    width: 5,
    height: 5,
  },
  slotsScroll: {
    padding: 16,
    paddingBottom: 110,
    gap: 12,
  },
  slotsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionDateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  sectionAvailabilityText: {
    fontSize: 13,
    color: '#3B5DF6',
    fontWeight: '600',
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
    maxWidth: 240,
  },
  slotsList: {
    gap: 10,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  slotCardSelected: {
    backgroundColor: '#F0F5FF',
    borderColor: '#3B5DF6',
  },
  slotTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slotTimeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  slotTimeTextSelected: {
    color: '#1E40AF',
    fontWeight: '700',
  },
  selectButtonBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  selectButtonBadgeSelected: {
    backgroundColor: '#3B5DF6',
  },
  selectButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  selectButtonTextSelected: {
    color: '#FFFFFF',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomBarInfo: {
    gap: 2,
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  selectedSubText: {
    fontSize: 12,
    color: '#6B7280',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3B5DF6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
  mentorBlockedBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 14,
  },
  mentorBlockedIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  mentorBlockedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  mentorBlockedText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  goBackPrimaryBtn: {
    marginTop: 12,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  goBackPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
