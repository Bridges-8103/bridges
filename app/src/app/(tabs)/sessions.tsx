import React from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mockNextSession } from '@/data/mock-mentors';

export default function SessionsScreen() {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>My Sessions</Text>
          <Text style={styles.subtitle}>Manage upcoming and completed mentoring sessions.</Text>
        </View>

        {/* Upcoming Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming (1)</Text>
          <View style={styles.sessionCard}>
            <View style={styles.cardHeader}>
              <Image source={{ uri: mockNextSession.mentorAvatarUri }} style={styles.avatar} />
              <View style={styles.mentorMeta}>
                <Text style={styles.sessionTitle}>{mockNextSession.title}</Text>
                <Text style={styles.mentorName}>{mockNextSession.mentorName}</Text>
                <Text style={styles.sessionTime}>🗓️ {mockNextSession.time}</Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <Pressable
                onPress={() => Alert.alert('Join Zoom', `Connecting to session with ${mockNextSession.mentorName}...`)}
                style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Join Zoom Call</Text>
              </Pressable>

              <Pressable
                onPress={() => Alert.alert('Reschedule', 'Rescheduling options sent to your email.')}
                style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Reschedule</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Completed Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Past Sessions (2)</Text>
          <View style={styles.pastCard}>
            <Text style={styles.pastTitle}>Resume & Portfolio Teardown</Text>
            <Text style={styles.pastMeta}>Marcus Okonkwo · Sep 12, 2026</Text>
            <Text style={styles.pastNotes}>{'"Great progress on distributed systems basics and backend architecture."'}</Text>
          </View>

          <View style={styles.pastCard}>
            <Text style={styles.pastTitle}>Intro to AI Research Careers</Text>
            <Text style={styles.pastMeta}>Dr. Priya Nair · Aug 28, 2026</Text>
            <Text style={styles.pastNotes}>{'"Reviewed candidate programs and research proposal topics."'}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 24,
  },
  header: {
    marginTop: 8,
    gap: 6,
  },
  title: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 14,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 18,
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  mentorMeta: {
    flex: 1,
    gap: 3,
  },
  sessionTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  mentorName: {
    color: '#6B7280',
    fontSize: 14,
  },
  sessionTime: {
    color: '#3B5DF6',
    fontSize: 13,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#3B5DF6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '600',
  },
  pastCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 16,
    gap: 6,
  },
  pastTitle: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '700',
  },
  pastMeta: {
    color: '#6B7280',
    fontSize: 13,
  },
  pastNotes: {
    color: '#4B5563',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
