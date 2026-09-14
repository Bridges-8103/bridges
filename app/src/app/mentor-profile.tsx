import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChipToggle } from '@/components/mentor-profile/chip-toggle';
import { LabeledInput } from '@/components/mentor-profile/labeled-input';
import { LabeledTextarea } from '@/components/mentor-profile/labeled-textarea';
import { PrimaryButton } from '@/components/mentor-profile/primary-button';
import { ProfileAvatar } from '@/components/mentor-profile/profile-avatar';
import { ProgressSteps } from '@/components/mentor-profile/progress-steps';
import { SectionCard } from '@/components/mentor-profile/section-card';
import { SelectField } from '@/components/mentor-profile/select-field';
import { SocialLinkInput } from '@/components/mentor-profile/social-link-input';
import { ThemedText } from '@/components/themed-text';
import { MAJOR_OPTIONS, mockMentorProfile, YEAR_OPTIONS } from '@/data/mock-mentor-profile';
import { useTheme } from '@/hooks/use-theme';
import type { SocialLinks, Tag } from '@/types/mentor-profile';

const BIO_MAX_LENGTH = 200;

export default function MentorProfileScreen() {
  const [fullName, setFullName] = useState(mockMentorProfile.fullName);
  const [bio, setBio] = useState(mockMentorProfile.bio);
  const [university, setUniversity] = useState(mockMentorProfile.university);
  const [year, setYear] = useState(mockMentorProfile.year);
  const [major, setMajor] = useState(mockMentorProfile.major);
  const [skills, setSkills] = useState<Tag[]>(mockMentorProfile.skills);
  const [interests, setInterests] = useState<Tag[]>(mockMentorProfile.interests);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(mockMentorProfile.socialLinks);

  const theme = useTheme();

  const toggleTag = (list: Tag[], setList: (tags: Tag[]) => void, id: string) => {
    setList(list.map((tag) => (tag.id === id ? { ...tag, selected: !tag.selected } : tag)));
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBackground }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.card }}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={[styles.logo, { backgroundColor: theme.primary }]}>
              <SymbolView
                name={{ ios: 'person.2.fill', android: 'people', web: 'people' }}
                size={16}
                tintColor="#fff"
              />
            </View>
            <ThemedText style={styles.brandText}>Bridges</ThemedText>
            <View style={{ flex: 1 }} />
            <ThemedText style={{ color: theme.mutedText, fontSize: 13 }}>Step 3 of 3</ThemedText>
          </View>
          <ProgressSteps total={3} current={3} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.titleBlock, { backgroundColor: theme.card }]}>
          <ThemedText type="title" style={styles.pageTitle}>
            Complete your profile
          </ThemedText>
          <ThemedText style={{ color: theme.mutedText }}>
            This helps us match you with the right people.
          </ThemedText>
        </View>

        <ProfileAvatar uri={mockMentorProfile.avatarUri} />

        <SectionCard title="Basic Info">
          <LabeledInput label="Full Name" value={fullName} onChangeText={setFullName} />
          <LabeledTextarea
            label="Bio"
            value={bio}
            onChangeText={setBio}
            maxLength={BIO_MAX_LENGTH}
          />
        </SectionCard>

        <SectionCard title="Academic">
          <LabeledInput label="University" value={university} onChangeText={setUniversity} />
          <View style={styles.row}>
            <SelectField
              label="Year"
              value={year}
              options={YEAR_OPTIONS}
              onChange={setYear}
              style={{ flex: 1 }}
            />
            <SelectField
              label="Major"
              value={major}
              options={MAJOR_OPTIONS}
              onChange={setMajor}
              style={{ flex: 1 }}
            />
          </View>
        </SectionCard>

        <SectionCard title="Skills" subtitle="Tap to add or remove">
          <View style={styles.chipRow}>
            {skills.map((tag) => (
              <ChipToggle
                key={tag.id}
                label={tag.label}
                selected={tag.selected}
                color="primary"
                onPress={() => toggleTag(skills, setSkills, tag.id)}
              />
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Interests" subtitle="Choose what you want to explore">
          <View style={styles.chipRow}>
            {interests.map((tag) => (
              <ChipToggle
                key={tag.id}
                label={tag.label}
                selected={tag.selected}
                color="accentPurple"
                onPress={() => toggleTag(interests, setInterests, tag.id)}
              />
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Social Links">
          <SocialLinkInput
            platform="linkedin"
            label="LinkedIn"
            placeholder="linkedin.com/in/username"
            value={socialLinks.linkedin}
            onChangeText={(text) => setSocialLinks({ ...socialLinks, linkedin: text })}
          />
          <SocialLinkInput
            platform="github"
            label="GitHub"
            placeholder="github.com/username"
            value={socialLinks.github}
            onChangeText={(text) => setSocialLinks({ ...socialLinks, github: text })}
          />
          <SocialLinkInput
            platform="twitter"
            label="Twitter"
            placeholder="twitter.com/yourname"
            value={socialLinks.twitter}
            onChangeText={(text) => setSocialLinks({ ...socialLinks, twitter: text })}
          />
        </SectionCard>

        <PrimaryButton label="Finish Setup" onPress={() => {}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  titleBlock: {
    marginBottom: 20,
    gap: 6,
  },
  pageTitle: {
    fontSize: 24,
    lineHeight: 30,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
