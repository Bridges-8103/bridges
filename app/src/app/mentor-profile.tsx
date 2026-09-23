import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
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
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import {
  useCreateProfileMutation,
  useUpdateProfileMutation,
} from '@/services/profile/mutations';
import { useProfileQuery } from '@/services/profile/queries';
import type { SocialLinks, Tag } from '@/types/mentor-profile';

const BIO_MAX_LENGTH = 200;

export default function MentorProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: profile, isPending: isLoadingProfile } = useProfileQuery();
  const createProfile = useCreateProfileMutation();
  const updateProfile = useUpdateProfileMutation();

  // Drafts stay null until the user types, so the saved profile (or Clerk)
  // supplies the displayed value without an effect seeding state.
  const [fullNameDraft, setFullNameDraft] = useState<string | null>(null);
  const [bioDraft, setBioDraft] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fields below are not yet part of the backend Profile contract
  // (displayName / bio / avatarUrl / phoneNumber). They stay local until the
  // schema grows MentorDetail / StudentDetail support.
  const [university, setUniversity] = useState(mockMentorProfile.university);
  const [year, setYear] = useState(mockMentorProfile.year);
  const [major, setMajor] = useState(mockMentorProfile.major);
  const [skills, setSkills] = useState<Tag[]>(mockMentorProfile.skills);
  const [interests, setInterests] = useState<Tag[]>(mockMentorProfile.interests);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(mockMentorProfile.socialLinks);

  const theme = useTheme();
  const isSaving = createProfile.isPending || updateProfile.isPending;
  const avatarUri = profile?.avatarUrl ?? user?.avatarUri;
  const fullName = fullNameDraft ?? profile?.displayName ?? user?.name ?? '';
  const bio = bioDraft ?? profile?.bio ?? '';

  const handleSave = async () => {
    const displayName = fullName.trim();
    setSaveError(null);

    if (displayName.length < 2) {
      setSaveError('Please enter a name of at least 2 characters.');
      return;
    }

    try {
      if (profile) {
        await updateProfile.mutateAsync({
          id: profile.id,
          input: { displayName, bio: bio.trim() || undefined },
        });
      } else {
        await createProfile.mutateAsync({
          userId: user?.id ?? '',
          displayName,
          bio: bio.trim() || undefined,
          avatarUrl: user?.avatarUri,
        });
      }
      router.replace('/(tabs)/profile');
    } catch (error) {
      // Alert.alert is a no-op on react-native-web, so surface errors inline.
      const response = (error as { response?: { status?: number; data?: { message?: string } } })
        .response;
      const detail = response?.data?.message;
      const status = response?.status;
      const message =
        detail ??
        (error instanceof Error ? error.message : 'Something went wrong. Please try again.');
      setSaveError(status ? `${status}: ${message}` : message);
    }
  };

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

        <ProfileAvatar uri={avatarUri ?? mockMentorProfile.avatarUri} />

        <SectionCard title="Basic Info">
          <LabeledInput label="Full Name" value={fullName} onChangeText={setFullNameDraft} />
          <LabeledTextarea
            label="Bio"
            value={bio}
            onChangeText={setBioDraft}
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

        {saveError ? (
          <View style={styles.errorBox}>
            <ThemedText style={styles.errorText}>{saveError}</ThemedText>
          </View>
        ) : null}

        {isLoadingProfile ? (
          <ActivityIndicator color={theme.primary} style={styles.loader} />
        ) : (
          <PrimaryButton
            label={isSaving ? 'Saving…' : 'Finish Setup'}
            loading={isSaving}
            onPress={handleSave}
          />
        )}
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
  loader: {
    paddingVertical: 16,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
  },
});
