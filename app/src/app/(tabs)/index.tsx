import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FieldCategoryCard } from '@/components/home/field-category-card';
import { MentorCard } from '@/components/home/mentor-card';
import { NextSessionCard } from '@/components/home/next-session-card';
import { SearchBar } from '@/components/home/search-bar';
import { mockFieldCategories, mockMentors, mockNextSession } from '@/data/mock-mentors';
import { useAuth } from '@/hooks/use-auth';
import type { Mentor } from '@/types/matching';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const userName = user?.name || 'Jamie Chen';
  const userAvatar =
    user?.avatarUri ||
    'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=256&h=256&fit=crop&crop=faces';

  // Filter mentors based on search query and selected field category
  const filteredMentors = mockMentors.filter((mentor) => {
    const matchesSearch =
      !searchQuery.trim() ||
      mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.expertise.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      !selectedCategory ||
      mentor.industry.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      mentor.expertise.some((e) => e.toLowerCase().includes(selectedCategory.toLowerCase()));

    return matchesSearch && matchesCategory;
  });

  const handleSelectMentor = (mentor: Mentor) => {
    Alert.alert(
      mentor.name,
      `${mentor.jobTitle} at ${mentor.company}\n\nExpertise: ${mentor.expertise.join(', ')}\nExperience: ${mentor.experienceYears} years\nRating: ${mentor.rating} (${mentor.sessionCount} sessions)`,
      [
        { text: 'Close', style: 'cancel' },
        {
          text: 'Book Session',
          onPress: () =>
            Alert.alert(
              'Session Request Sent',
              `Your request has been submitted to ${mentor.name}. You'll receive a confirmation soon.`
            ),
        },
      ]
    );
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
            onPress={() => router.push('/mentor-profile')}
            style={styles.profileButton}>
            <Image source={{ uri: userAvatar }} style={styles.profileAvatar} />
            <View style={styles.onlineBadge} />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        {/* Next Session Banner Card */}
        <View style={styles.bannerSection}>
          <NextSessionCard session={mockNextSession} />
        </View>

        {/* Browse by Field Section */}
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
          {mockFieldCategories.map((category) => (
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

        {/* Top Mentors Section */}
        <View style={[styles.sectionHeader, styles.topMentorsHeader]}>
          <Text style={styles.sectionTitle}>Top mentors</Text>
          <Pressable onPress={() => router.push('/explore')}>
            <Text style={styles.sectionAction}>See all</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mentorsScroll}>
          {filteredMentors.length > 0 ? (
            filteredMentors.map((mentor) => (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                onPress={() => handleSelectMentor(mentor)}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No mentors match your search.</Text>
            </View>
          )}
        </ScrollView>
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
    gap: 10,
  },
  mentorsScroll: {
    gap: 14,
    paddingRight: 8,
    paddingBottom: 8,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});
