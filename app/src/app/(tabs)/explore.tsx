import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { calculateMentorMatches, mockMentors } from '@/data/mock-mentors';
import type { MentorMatch, StudentPreferences } from '@/types/matching';

const AVAILABLE_INTERESTS = [
  'Machine Learning',
  'Cloud Computing',
  'Cybersecurity',
  'Backend',
  'Design Systems',
  'Distributed Systems',
  'Product Strategy',
  'Python',
  'Intellectual Property',
];

export default function ExploreScreen() {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Machine Learning',
    'Python',
  ]);
  const [careerGoal] = useState('AI Research');
  const [industryPreference] = useState('Technology & AI');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate ranked matches dynamically using BRIDGES algorithm
  const currentPreferences: StudentPreferences = {
    interests: selectedInterests,
    careerGoal,
    industryPreference,
  };

  const matches: MentorMatch[] = calculateMentorMatches(currentPreferences, mockMentors);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const filteredMatches = matches.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.mentor.name.toLowerCase().includes(q) ||
      item.mentor.jobTitle.toLowerCase().includes(q) ||
      item.mentor.company.toLowerCase().includes(q)
    );
  });

  const handleBook = (match: MentorMatch) => {
    Alert.alert(
      `Book Session with ${match.mentor.name}`,
      `Match Score: ${match.score}%\n\nReasons:\n• ${match.reasons.join('\n• ')}\n\nWould you like to send a mentorship request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Request',
          onPress: () =>
            Alert.alert(
              'Request Sent!',
              `Your request was sent to ${match.mentor.name}. They usually reply within 24 hours.`
            ),
        },
      ]
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Find Your Mentor</Text>
          <Text style={styles.subtitle}>
            Personalized recommendations ranked by your goals and interests.
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            size={18}
            tintColor="#9CA3AF"
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, role, or company..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
        </View>

        {/* Interests Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Your Interests & Goals</Text>
          <View style={styles.chipGrid}>
            {AVAILABLE_INTERESTS.map((interest) => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <Pressable
                  key={interest}
                  onPress={() => toggleInterest(interest)}
                  style={[styles.chip, isSelected && styles.chipSelected]}>
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {interest}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Matchmaking Results */}
        <View style={styles.section}>
          <View style={styles.resultsHeader}>
            <Text style={styles.sectionLabel}>Ranked Recommendations</Text>
            <Text style={styles.matchCountBadge}>{filteredMatches.length} Matches</Text>
          </View>

          <View style={styles.matchesList}>
            {filteredMatches.map((match) => (
              <View key={match.mentor.id} style={styles.matchCard}>
                <View style={styles.cardTop}>
                  <Image
                    source={{
                      uri:
                        match.mentor.avatarUri ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
                    }}
                    style={styles.avatar}
                  />

                  <View style={styles.mentorInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.mentorName}>{match.mentor.name}</Text>
                      <View style={styles.scoreBadge}>
                        <Text style={styles.scoreText}>{match.score}% Match</Text>
                      </View>
                    </View>
                    <Text style={styles.mentorRole}>
                      {match.mentor.jobTitle} · {match.mentor.company}
                    </Text>
                    <Text style={styles.mentorExp}>
                      ★ {match.mentor.rating} · {match.mentor.experienceYears} yrs experience
                    </Text>
                  </View>
                </View>

                {/* Match Reasons */}
                <View style={styles.reasonsContainer}>
                  {match.reasons.map((reason, idx) => (
                    <View key={idx} style={styles.reasonPill}>
                      <Text style={styles.reasonText}>✓ {reason}</Text>
                    </View>
                  ))}
                </View>

                {/* Action */}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handleBook(match)}
                  style={styles.connectButton}>
                  <Text style={styles.connectButtonText}>Connect with {match.mentor.name.split(' ')[0]}</Text>
                </Pressable>
              </View>
            ))}
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
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
    lineHeight: 20,
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
  section: {
    gap: 12,
  },
  sectionLabel: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F8',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#3B5DF6',
  },
  chipText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#3B5DF6',
    fontWeight: '700',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  cardTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EEF2FF',
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
  },
  scoreBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreText: {
    color: '#3B5DF6',
    fontSize: 12,
    fontWeight: '800',
  },
  mentorRole: {
    color: '#6B7280',
    fontSize: 13,
  },
  mentorExp: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
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
  connectButton: {
    backgroundColor: '#3B5DF6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
