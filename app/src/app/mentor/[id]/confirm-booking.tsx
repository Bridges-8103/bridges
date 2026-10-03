import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ROUTES } from '@/constants/routes';
import { useMentorDetailQuery } from '@/services/mentors/queries';
import {
  useCreateBookingsMutation,
  useMentorAvailableSlotsQuery,
} from '@/services/sessions';
import type { SessionBookingRequestItem } from '@/services/sessions/types';

function formatDateTimeRange(startTimeIso: string, endTimeIso: string): { dateStr: string; timeStr: string } {
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

export default function ConfirmBookingScreen() {
  const router = useRouter();
  const { id, slotIds: rawSlotIds } = useLocalSearchParams<{ id: string; slotIds: string }>();

  const slotIds = useMemo(() => {
    if (!rawSlotIds) return [];
    return rawSlotIds
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
  }, [rawSlotIds]);

  const { data: mentor, isLoading: isMentorLoading } = useMentorDetailQuery(id ?? '');
  const { data: availableSlots = [], isLoading: isSlotsLoading } =
    useMentorAvailableSlotsQuery(id ?? '');

  const createBookingsMutation = useCreateBookingsMutation();

  // Find the selected slots
  const selectedSlots = useMemo(() => {
    return availableSlots.filter((s) => slotIds.includes(s.id));
  }, [availableSlots, slotIds]);

  // Per-slot topics state: Map<slotId, { topic: string; notes: string }>
  const [slotDetails, setSlotDetails] = useState<Record<number, { topic: string; notes: string }>>({});

  const getSlotTopic = (slotId: number) => slotDetails[slotId]?.topic || '';
  const getSlotNotes = (slotId: number) => slotDetails[slotId]?.notes || '';

  const updateTopic = (slotId: number, text: string) => {
    setSlotDetails((prev) => ({
      ...prev,
      [slotId]: {
        topic: text,
        notes: prev[slotId]?.notes || '',
      },
    }));
  };

  const updateNotes = (slotId: number, text: string) => {
    setSlotDetails((prev) => ({
      ...prev,
      [slotId]: {
        topic: prev[slotId]?.topic || '',
        notes: text,
      },
    }));
  };

  const copyFirstTopicToAll = () => {
    if (selectedSlots.length <= 1) return;
    const firstTopic = getSlotTopic(selectedSlots[0].id);
    const firstNotes = getSlotNotes(selectedSlots[0].id);
    if (!firstTopic.trim()) {
      Alert.alert('Empty Topic', 'Please write a topic in the first session before copying.');
      return;
    }

    const updated: Record<number, { topic: string; notes: string }> = {};
    for (const slot of selectedSlots) {
      updated[slot.id] = {
        topic: firstTopic,
        notes: firstNotes,
      };
    }
    setSlotDetails(updated);
    Alert.alert('Applied! ✨', 'Copied topic to all selected sessions.');
  };

  const handleSubmit = async () => {
    if (!id || selectedSlots.length === 0) return;

    // Validation: check each slot has a topic
    for (let i = 0; i < selectedSlots.length; i++) {
      const slot = selectedSlots[i];
      const topic = getSlotTopic(slot.id).trim();
      if (!topic) {
        Alert.alert(
          'Missing Information',
          `Please enter what you want to cover for Session ${i + 1} (${formatDateTimeRange(slot.startTime, slot.endTime).dateStr}).`
        );
        return;
      }
    }

    const payloadBookings: SessionBookingRequestItem[] = selectedSlots.map((slot) => ({
      slotId: slot.id,
      topic: getSlotTopic(slot.id).trim(),
      notes: getSlotNotes(slot.id).trim() || undefined,
    }));

    try {
      await createBookingsMutation.mutateAsync({
        mentorId: parseInt(id, 10),
        bookings: payloadBookings,
      });

      Alert.alert(
        'Request Submitted! 🎉',
        `Your request for ${selectedSlots.length} session${
          selectedSlots.length > 1 ? 's' : ''
        } has been sent to ${mentor?.name || 'the mentor'}. You can check the approval status under My Sessions.`,
        [
          {
            text: 'View My Sessions',
            onPress: () => {
              router.replace(ROUTES.TABS);
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        'Booking Failed',
        err?.message || 'Could not submit your booking request. Please check slot availability and try again.'
      );
    }
  };

  if (isMentorLoading || isSlotsLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#3B5DF6" />
          <Text style={styles.loadingText}>Loading booking details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
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
            <Text style={styles.title}>Confirm Booking</Text>
            <Text style={styles.subtitle}>Review & session topics</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Mentor Profile Overview */}
          {mentor ? (
            <View style={styles.mentorSummaryCard}>
              {mentor.avatarUrl ? (
                <Image source={{ uri: mentor.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>
                    {mentor.name.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.mentorMeta}>
                <Text style={styles.mentorName}>{mentor.name}</Text>
                <Text style={styles.mentorJob}>
                  {mentor.jobTitle || 'Mentor'}
                  {mentor.company ? ` · ${mentor.company}` : ''}
                </Text>
                <View style={styles.summaryBadgeRow}>
                  <View style={styles.summaryBadge}>
                    <Text style={styles.summaryBadgeText}>
                      {selectedSlots.length} {selectedSlots.length === 1 ? 'Session' : 'Sessions'}
                    </Text>
                  </View>
                  <View style={styles.summaryBadge}>
                    <Text style={styles.summaryBadgeText}>
                      ⏱️ {selectedSlots.length * 30} mins total
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {/* Helper button if multiple sessions */}
          {selectedSlots.length > 1 ? (
            <Pressable
              onPress={copyFirstTopicToAll}
              style={({ pressed }) => [styles.copyAllButton, pressed && styles.pressed]}>
              <SymbolView
                name={{ ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' }}
                size={16}
                tintColor="#3B5DF6"
              />
              <Text style={styles.copyAllButtonText}>
                Apply Session 1 topic to all {selectedSlots.length} sessions
              </Text>
            </Pressable>
          ) : null}

          {/* Section: What to cover per session */}
          <Text style={styles.sectionHeaderTitle}>Session Details & Objectives</Text>

          {selectedSlots.map((slot, index) => {
            const { dateStr, timeStr } = formatDateTimeRange(slot.startTime, slot.endTime);
            const topicValue = getSlotTopic(slot.id);
            const notesValue = getSlotNotes(slot.id);

            return (
              <View key={slot.id} style={styles.sessionCard}>
                <View style={styles.sessionCardHeader}>
                  <View style={styles.sessionIndexPill}>
                    <Text style={styles.sessionIndexText}>Session {index + 1}</Text>
                  </View>
                  <View style={styles.timeTag}>
                    <Text style={styles.timeTagText}>
                      🗓️ {dateStr} · {timeStr}
                    </Text>
                  </View>
                </View>

                {/* What do you want to cover input */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    What do you want to cover? <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., Portfolio teardown, Interview practice, Career transition advice..."
                    placeholderTextColor="#9CA3AF"
                    value={topicValue}
                    onChangeText={(val) => updateTopic(slot.id, val)}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Additional notes input */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldSubLabel}>Additional Notes or Links (Optional)</Text>
                  <TextInput
                    style={[styles.textInput, styles.notesInput]}
                    placeholder="e.g., GitHub link, specific questions or goals..."
                    placeholderTextColor="#9CA3AF"
                    value={notesValue}
                    onChangeText={(val) => updateNotes(slot.id, val)}
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </View>
            );
          })}

          {/* Info notice */}
          <View style={styles.noticeCard}>
            <SymbolView
              name={{ ios: 'info.circle', android: 'info', web: 'info' }}
              size={18}
              tintColor="#3B5DF6"
            />
            <Text style={styles.noticeText}>
              Sessions are pending until confirmed by your mentor. You will see updates in your
              Sessions tab once approved.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.bottomBar}>
          <Pressable
            accessibilityRole="button"
            disabled={createBookingsMutation.isPending}
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.submitButton,
              createBookingsMutation.isPending && styles.submitButtonDisabled,
              pressed && styles.pressed,
            ]}>
            {createBookingsMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                Confirm & Send Request ({selectedSlots.length})
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
    gap: 16,
  },
  mentorSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#3B5DF6',
    fontSize: 18,
    fontWeight: '800',
  },
  mentorMeta: {
    flex: 1,
    gap: 3,
  },
  mentorName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  mentorJob: {
    fontSize: 13,
    color: '#6B7280',
  },
  summaryBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  summaryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  summaryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B5DF6',
  },
  copyAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  copyAllButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B5DF6',
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginTop: 4,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#F3F4F6',
    paddingBottom: 10,
  },
  sessionIndexPill: {
    backgroundColor: '#3B5DF6',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sessionIndexText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  timeTag: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeTagText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  fieldSubLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  requiredStar: {
    color: '#EF4444',
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    minHeight: 64,
    textAlignVertical: 'top',
  },
  notesInput: {
    minHeight: 48,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
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
  submitButton: {
    backgroundColor: '#3B5DF6',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  pressed: {
    opacity: 0.8,
  },
});
