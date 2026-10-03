import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SESSION_CONFIG } from '@/constants/sessions';
import {
  useMentorConfiguredSlotsQuery,
  useSetMentorAvailabilityMutation,
} from '@/services/sessions';
import type { SetAvailabilitySlotItem, SlotDto } from '@/services/sessions/types';

// Helper to format ISO to date string YYYY-MM-DD
function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Generate next N days
function getNextDays(daysCount = 14): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

// Standard 30-min time intervals between startHour and endHour
function generateDayIntervals(startHour = 9, endHour = 18): string[] {
  const times: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    const hourStr = String(h).padStart(2, '0');
    times.push(`${hourStr}:00`);
    times.push(`${hourStr}:30`);
  }
  return times;
}

export default function MentorAvailabilityScreen() {
  const router = useRouter();

  const daysList = useMemo(() => getNextDays(14), []);
  const [selectedDate, setSelectedDate] = useState<Date>(daysList[0]);
  const activeDateKey = toDateKey(selectedDate);

  const { data: serverSlots = [], isLoading, refetch } = useMentorConfiguredSlotsQuery();
  const saveMutation = useSetMentorAvailabilityMutation();

  // Local draft of enabled slot keys: Set<"YYYY-MM-DDTHH:mm:00.000Z">
  const [draftSlots, setDraftSlots] = useState<Map<string, boolean>>(() => new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Group server slots by dateKey
  const serverSlotsByDate = useMemo(() => {
    const map = new Map<string, SlotDto[]>();
    for (const slot of serverSlots) {
      const d = new Date(slot.startTime);
      const k = toDateKey(d);
      const list = map.get(k) || [];
      list.push(slot);
      map.set(k, list);
    }
    return map;
  }, [serverSlots]);

  // Standard interval list for display (9:00 to 18:00)
  const timeIntervals = useMemo(() => generateDayIntervals(9, 18), []);

  // Compute state of a slot: local draft takes precedence, otherwise server slot
  const isSlotEnabled = (timeStr: string): boolean => {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(selectedDate);
    d.setHours(h, m, 0, 0);
    const iso = d.toISOString();

    if (draftSlots.has(iso)) {
      return draftSlots.get(iso) === true;
    }

    const daySlots = serverSlotsByDate.get(activeDateKey) || [];
    const match = daySlots.find((s) => new Date(s.startTime).toISOString() === iso);
    return match ? match.isAvailable : false;
  };

  const getBookedStatus = (timeStr: string): SlotDto | undefined => {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(selectedDate);
    d.setHours(h, m, 0, 0);
    const iso = d.toISOString();

    const daySlots = serverSlotsByDate.get(activeDateKey) || [];
    return daySlots.find(
      (s) => new Date(s.startTime).toISOString() === iso && s.isBooked
    );
  };

  const toggleSlot = (timeStr: string) => {
    const booked = getBookedStatus(timeStr);
    if (booked) {
      Alert.alert(
        'Slot Reserved',
        'This slot has an active booking request from a student and cannot be disabled.'
      );
      return;
    }

    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(selectedDate);
    d.setHours(h, m, 0, 0);
    const iso = d.toISOString();

    const currentlyOn = isSlotEnabled(timeStr);
    const nextMap = new Map(draftSlots);
    nextMap.set(iso, !currentlyOn);
    setDraftSlots(nextMap);
    setHasUnsavedChanges(true);
  };

  // Presets: Morning, Afternoon, All, Clear
  const applyPreset = (preset: 'morning' | 'afternoon' | 'all' | 'clear') => {
    const nextMap = new Map(draftSlots);

    for (const timeStr of timeIntervals) {
      const booked = getBookedStatus(timeStr);
      if (booked) continue; // Skip booked

      const [h, m] = timeStr.split(':').map(Number);
      const d = new Date(selectedDate);
      d.setHours(h, m, 0, 0);
      const iso = d.toISOString();

      let shouldEnable = false;
      if (preset === 'morning') {
        shouldEnable = h >= 9 && h < 12;
      } else if (preset === 'afternoon') {
        shouldEnable = h >= 13 && h < 17;
      } else if (preset === 'all') {
        shouldEnable = true;
      } else if (preset === 'clear') {
        shouldEnable = false;
      }

      nextMap.set(iso, shouldEnable);
    }

    setDraftSlots(nextMap);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    // Collect all slots that were either modified in draft or exist on the selected day
    const slotsToSubmit: SetAvailabilitySlotItem[] = [];

    // All intervals for the current day
    for (const timeStr of timeIntervals) {
      const [h, m] = timeStr.split(':').map(Number);
      const start = new Date(selectedDate);
      start.setHours(h, m, 0, 0);
      const end = new Date(start.getTime() + SESSION_CONFIG.SLOT_DURATION_MINUTES * 60 * 1000);

      const isAvail = isSlotEnabled(timeStr);
      slotsToSubmit.push({
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        isAvailable: isAvail,
      });
    }

    try {
      await saveMutation.mutateAsync({ slots: slotsToSubmit });
      setHasUnsavedChanges(false);
      Alert.alert(
        'Availability Saved! 🗓️',
        `Your 30-minute availability slots for ${selectedDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })} have been updated.`
      );
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not save availability. Please try again.');
    }
  };

  const activeCountForDay = timeIntervals.filter((t) => isSlotEnabled(t)).length;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (hasUnsavedChanges) {
              Alert.alert(
                'Discard Changes?',
                'You have unsaved availability changes. Are you sure you want to leave?',
                [
                  { text: 'Keep Editing', style: 'cancel' },
                  { text: 'Discard', style: 'destructive', onPress: () => router.back() },
                ]
              );
            } else {
              router.back();
            }
          }}
          style={styles.backButton}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            size={20}
            tintColor="#111827"
          />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>Set Availability</Text>
          <Text style={styles.subtitle}>Configure bookable 30-min slots</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Date Carousel (Horizontal Strip) */}
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
            const hasSlots = (serverSlotsByDate.get(key) || []).some((s) => s.isAvailable);

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
                {hasSlots ? (
                  <View style={[styles.dotIndicator, isSelected && styles.dotIndicatorSelected]} />
                ) : (
                  <View style={styles.dotPlaceholder} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {/* Quick Presets Bar */}
        <View style={styles.presetsCard}>
          <Text style={styles.presetsTitle}>Quick Presets:</Text>
          <View style={styles.presetsRow}>
            <Pressable
              onPress={() => applyPreset('morning')}
              style={styles.presetButton}>
              <Text style={styles.presetButtonText}>+ Morning (9–12)</Text>
            </Pressable>
            <Pressable
              onPress={() => applyPreset('afternoon')}
              style={styles.presetButton}>
              <Text style={styles.presetButtonText}>+ Afternoon (1–5)</Text>
            </Pressable>
            <Pressable
              onPress={() => applyPreset('all')}
              style={styles.presetButton}>
              <Text style={styles.presetButtonText}>Select All</Text>
            </Pressable>
            <Pressable
              onPress={() => applyPreset('clear')}
              style={[styles.presetButton, styles.presetButtonClear]}>
              <Text style={[styles.presetButtonText, styles.presetButtonClearText]}>Clear</Text>
            </Pressable>
          </View>
        </View>

        {/* Selected Date Header */}
        <View style={styles.dateSectionHeader}>
          <Text style={styles.dateSectionTitle}>
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.slotsCountBadge}>
            {activeCountForDay} active {activeCountForDay === 1 ? 'slot' : 'slots'}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color="#3B5DF6" />
            <Text style={styles.loadingText}>Loading availability…</Text>
          </View>
        ) : (
          /* 30-min Slots Grid */
          <View style={styles.slotsGrid}>
            {timeIntervals.map((timeStr) => {
              const enabled = isSlotEnabled(timeStr);
              const booked = getBookedStatus(timeStr);

              // Calculate end time string (timeStr + 30m)
              const [h, m] = timeStr.split(':').map(Number);
              const endMin = m + 30;
              const endH = endMin >= 60 ? h + 1 : h;
              const formattedEnd = `${String(endH).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;

              return (
                <Pressable
                  key={timeStr}
                  onPress={() => toggleSlot(timeStr)}
                  style={[
                    styles.slotCard,
                    enabled && styles.slotCardActive,
                    booked && styles.slotCardBooked,
                  ]}>
                  <View style={styles.slotLeft}>
                    <SymbolView
                      name={{
                        ios: booked
                          ? 'lock.fill'
                          : enabled
                          ? 'checkmark.circle.fill'
                          : 'circle',
                        android: booked
                          ? 'lock'
                          : enabled
                          ? 'check_circle'
                          : 'radio_button_unchecked',
                        web: booked ? 'lock' : enabled ? 'check_circle' : 'radio_button_unchecked',
                      }}
                      size={18}
                      tintColor={booked ? '#D97706' : enabled ? '#3B5DF6' : '#9CA3AF'}
                    />
                    <Text
                      style={[
                        styles.slotTimeText,
                        enabled && styles.slotTimeTextActive,
                        booked && styles.slotTimeTextBooked,
                      ]}>
                      {timeStr} – {formattedEnd}
                    </Text>
                  </View>

                  {booked ? (
                    <View style={styles.bookedTag}>
                      <Text style={styles.bookedTagText}>Booked</Text>
                    </View>
                  ) : (
                    <Text style={[styles.slotStateBadge, enabled && styles.slotStateBadgeActive]}>
                      {enabled ? 'Available' : 'Off'}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Save Bar */}
      <View style={styles.bottomBar}>
        <Pressable
          accessibilityRole="button"
          disabled={saveMutation.isPending}
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveButton,
            saveMutation.isPending && styles.saveButtonDisabled,
            pressed && styles.pressed,
          ]}>
          {saveMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              Save Availability ({activeCountForDay} slots active)
            </Text>
          )}
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
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
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
  bodyContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },
  presetsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  presetsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  presetButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B5DF6',
  },
  presetButtonClear: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  presetButtonClearText: {
    color: '#6B7280',
  },
  dateSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  dateSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  slotsCountBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B5DF6',
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
  slotsGrid: {
    gap: 8,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  slotCardActive: {
    backgroundColor: '#F0F5FF',
    borderColor: '#3B5DF6',
  },
  slotCardBooked: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  slotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slotTimeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  slotTimeTextActive: {
    color: '#1E40AF',
    fontWeight: '700',
  },
  slotTimeTextBooked: {
    color: '#92400E',
    fontWeight: '600',
  },
  slotStateBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  slotStateBadgeActive: {
    color: '#3B5DF6',
  },
  bookedTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bookedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
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
  },
  saveButton: {
    backgroundColor: '#3B5DF6',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});
