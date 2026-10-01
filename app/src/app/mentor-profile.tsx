import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';

import { CompactTagCard } from '@/components/common/compact-tag-card';
import { LabeledInput } from '@/components/mentor-profile/labeled-input';
import { LabeledTextarea } from '@/components/mentor-profile/labeled-textarea';
import { PrimaryButton } from '@/components/mentor-profile/primary-button';
import { ProfileAvatar } from '@/components/mentor-profile/profile-avatar';
import { ProgressSteps } from '@/components/mentor-profile/progress-steps';
import { SectionCard } from '@/components/mentor-profile/section-card';
import { SelectField } from '@/components/mentor-profile/select-field';
import { SocialLinkInput } from '@/components/mentor-profile/social-link-input';
import { ThemedText } from '@/components/themed-text';
import { MAJOR_OPTIONS, YEAR_OPTIONS } from '@/data/mock-mentor-profile';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useCreateProfileMutation, useUpdateProfileMutation } from '@/services/profile/mutations';
import { useProfileQuery } from '@/services/profile/queries';
import type { UserProfile } from '@/services/profile/types';
import type { SocialLinks } from '@/types/mentor-profile';

const BIO_MAX_LENGTH = 250;

export default function MentorProfileScreen() {
  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useProfileQuery();
  const params = useLocalSearchParams<{ role?: string; isNew?: string; name?: string }>();
  const theme = useTheme();

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.pageBackground },
        ]}>
        <ActivityIndicator size="large" color="#3B5DF6" />
      </View>
    );
  }

  // Issue 1: If API call to profile is error, display card as cannot fetch profile instead of assuming not setup
  if (isError) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.pageBackground, padding: 24 },
        ]}>
        <View style={styles.errorCard}>
          <Text style={styles.errorCardTitle}>Cannot fetch profile</Text>
          <Text style={styles.errorCardText}>
            {error?.message ||
              'Unable to retrieve your profile information. Please check your connection and try again.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={isRefetching}
            onPress={() => refetch()}
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
            <Text style={styles.retryButtonText}>{isRefetching ? 'Retrying…' : 'Retry'}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <AdaptiveProfileForm
      key={profile?.updatedAt ? `${profile.id}-${profile.updatedAt}` : (profile?.id ?? 'new-profile')}
      profile={profile}
      params={params}
    />
  );
}

function AdaptiveProfileForm({
  profile,
  params,
}: {
  profile: UserProfile | null | undefined;
  params: { role?: string; isNew?: string; name?: string };
}) {
  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuth();
  const createProfileMutation = useCreateProfileMutation();
  const updateProfileMutation = useUpdateProfileMutation();

  const isNew = params.isNew === 'true' || !profile;

  // Single locked role: user selects when registering and cannot change it
  const role: 'STUDENT' | 'MENTOR' =
    (params.role?.toUpperCase() === 'MENTOR' || profile?.role === 'MENTOR')
      ? 'MENTOR'
      : 'STUDENT';

  // Common Fields
  const [fullName, setFullName] = useState(
    profile?.displayName || params.name || user?.name || ''
  );
  const [bio, setBio] = useState(profile?.bio || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');

  // Student Fields
  const [university, setUniversity] = useState(
    profile?.studentDetail?.university || 'University of Adelaide'
  );
  const [year, setYear] = useState(
    profile?.studentDetail?.yearOfStudy ? `Year ${profile.studentDetail.yearOfStudy}` : 'Year 3'
  );
  const [major, setMajor] = useState(
    profile?.studentDetail?.fieldOfStudy || profile?.studentDetail?.degree || 'Computer Science'
  );
  const [careerGoals, setCareerGoals] = useState(profile?.studentDetail?.careerGoals || '');

  // Mentor Fields
  const [jobTitle, setJobTitle] = useState(profile?.mentorDetail?.jobTitle || 'Software Engineer');
  const [company, setCompany] = useState(profile?.mentorDetail?.company || 'Google');
  const [industry, setIndustry] = useState(
    profile?.mentorDetail?.industry || 'Technology & Software'
  );
  const [yearsExperience, setYearsExperience] = useState(
    String(profile?.mentorDetail?.yearsExperience || '5')
  );

  // Tags: prioritize server cache from profile, fallback to local state for new profiles
  const [skills, setSkills] = useState<string[]>(
    () => profile?.studentDetail?.skills || ['Python', 'Data Analysis']
  );

  const [interests, setInterests] = useState<string[]>(
    () => profile?.studentDetail?.interests || ['Artificial Intelligence', 'Machine learning']
  );

  const [expertise, setExpertise] = useState<string[]>(
    () => profile?.mentorDetail?.expertise || ['Artificial Intelligence', 'Software Engineering']
  );

  const currentSkills = profile?.studentDetail?.skills ?? skills;
  const currentInterests = profile?.studentDetail?.interests ?? interests;
  const currentExpertise = profile?.mentorDetail?.expertise ?? expertise;

  const handleRemoveSkill = (tagToRemove: string) => {
    const updated = currentSkills.filter((s) => s !== tagToRemove);
    setSkills(updated);
    if (profile?.id) {
      updateProfileMutation.mutate({ id: profile.id, input: { skills: updated } });
    }
  };

  const handleRemoveInterest = (tagToRemove: string) => {
    const updated = currentInterests.filter((s) => s !== tagToRemove);
    setInterests(updated);
    if (profile?.id) {
      updateProfileMutation.mutate({ id: profile.id, input: { interests: updated } });
    }
  };

  const handleRemoveExpertise = (tagToRemove: string) => {
    const updated = currentExpertise.filter((s) => s !== tagToRemove);
    setExpertise(updated);
    if (profile?.id) {
      updateProfileMutation.mutate({ id: profile.id, input: { expertise: updated } });
    }
  };

  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    linkedin: profile?.mentorDetail?.linkedinUrl || '',
    github: '',
    twitter: '',
  });

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Missing Name', 'Please provide your full name.');
      return;
    }

    const selectedSkills = currentSkills;
    const selectedInterests = currentInterests;
    const selectedExpertise = currentExpertise;

    const yearNumber = parseInt(year.replace(/[^0-9]/g, ''), 10) || 1;
    const expNumber = parseInt(yearsExperience.replace(/[^0-9]/g, ''), 10) || 1;

    try {
      if (profile) {
        // Update existing profile (avatar is managed directly through Clerk)
        await updateProfileMutation.mutateAsync({
          id: profile.id,
          input: {
            displayName: fullName.trim(),
            role,
            bio: bio.trim(),
            phoneNumber: phoneNumber.trim() || undefined,
            university: role === 'STUDENT' ? university : undefined,
            degree: role === 'STUDENT' ? major : undefined,
            fieldOfStudy: role === 'STUDENT' ? major : undefined,
            yearOfStudy: role === 'STUDENT' ? yearNumber : undefined,
            skills: role === 'STUDENT' ? selectedSkills : undefined,
            interests: role === 'STUDENT' ? selectedInterests : undefined,
            careerGoals: role === 'STUDENT' ? careerGoals.trim() : undefined,
            jobTitle: role === 'MENTOR' ? jobTitle.trim() : undefined,
            company: role === 'MENTOR' ? company.trim() : undefined,
            industry: role === 'MENTOR' ? industry.trim() : undefined,
            yearsExperience: role === 'MENTOR' ? expNumber : undefined,
            expertise: role === 'MENTOR' ? selectedExpertise : undefined,
            linkedinUrl: role === 'MENTOR' ? socialLinks.linkedin.trim() : undefined,
          },
        });

        Alert.alert('Profile Updated', 'Your profile details have been successfully saved.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/profile') },
        ]);
      } else {
        // Create new profile (avatar is managed directly through Clerk)
        await createProfileMutation.mutateAsync({
          userId: user?.id || 'usr_current',
          email: user?.email,
          displayName: fullName.trim(),
          role,
          bio: bio.trim(),
          phoneNumber: phoneNumber.trim() || undefined,
          university: role === 'STUDENT' ? university : undefined,
          degree: role === 'STUDENT' ? major : undefined,
          fieldOfStudy: role === 'STUDENT' ? major : undefined,
          yearOfStudy: role === 'STUDENT' ? yearNumber : undefined,
          skills: role === 'STUDENT' ? selectedSkills : undefined,
          interests: role === 'STUDENT' ? selectedInterests : undefined,
          careerGoals: role === 'STUDENT' ? careerGoals.trim() : undefined,
          jobTitle: role === 'MENTOR' ? jobTitle.trim() : undefined,
          company: role === 'MENTOR' ? company.trim() : undefined,
          industry: role === 'MENTOR' ? industry.trim() : undefined,
          yearsExperience: role === 'MENTOR' ? expNumber : undefined,
          expertise: role === 'MENTOR' ? selectedExpertise : undefined,
          linkedinUrl: role === 'MENTOR' ? socialLinks.linkedin.trim() : undefined,
        });

        Alert.alert('Welcome to Bridges!', 'Your profile has been created successfully.', [
          { text: 'Get Started', onPress: () => router.replace('/(tabs)') },
        ]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to save profile changes.';
      Alert.alert('Error', msg);
    }
  };

  const isSaving = createProfileMutation.isPending || updateProfileMutation.isPending;

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBackground }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.card }}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)/profile');
                }
              }}
              style={styles.backButton}>
              <SymbolView
                name={{ ios: 'chevron.left', android: 'arrow_back', web: 'chevron_left' }}
                size={18}
                tintColor="#111827"
              />
            </Pressable>

            <View
              style={[
                styles.logo,
                { backgroundColor: role === 'MENTOR' ? '#7C3AED' : theme.primary },
              ]}>
              <Text style={{ fontSize: 16 }}>{role === 'MENTOR' ? '🌟' : '🎓'}</Text>
            </View>

            <ThemedText style={styles.brandText}>
              {role === 'MENTOR' ? 'Mentor Profile' : 'Student Profile'}
            </ThemedText>

            <View style={{ flex: 1 }} />
            {isNew ? (
              <ThemedText style={{ color: theme.mutedText, fontSize: 13 }}>Step 3 of 3</ThemedText>
            ) : null}
          </View>
          {isNew ? <ProgressSteps total={3} current={3} /> : null}
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.titleBlock, { backgroundColor: theme.card }]}>
          <ThemedText type="title" style={styles.pageTitle}>
            {isNew
              ? role === 'MENTOR'
                ? 'Complete your mentor profile'
                : 'Complete your student profile'
              : role === 'MENTOR'
              ? 'Edit your mentor profile'
              : 'Edit your student profile'}
          </ThemedText>
          <ThemedText style={{ color: theme.mutedText }}>
            {isNew
              ? role === 'MENTOR'
                ? 'Share your experience to help students find and connect with you.'
                : 'Help us match you with the right industry mentors and peers.'
              : 'Keep your information up to date for better mentorship matches.'}
          </ThemedText>
        </View>

        <ProfileAvatar uri={user?.avatarUri} />

        {/* Basic Info */}
        <SectionCard title="Basic Info">
          <LabeledInput
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your name"
          />
          <LabeledTextarea
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder={
              role === 'MENTOR'
                ? 'Share your experience, leadership philosophy, or advice…'
                : 'Share your career ambitions, projects, and what you are looking for…'
            }
            maxLength={BIO_MAX_LENGTH}
          />
          <LabeledInput
            label="Phone Number (Optional)"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="+61 400 000 000"
          />
        </SectionCard>

        {/* STUDENT SECTION - ONLY VISIBLE TO STUDENTS */}
        {role === 'STUDENT' && (
          <>
            <SectionCard title="Academic Background">
              <LabeledInput
                label="University"
                value={university}
                onChangeText={setUniversity}
                placeholder="University name"
              />
              <View style={styles.row}>
                <SelectField
                  label="Year"
                  value={year}
                  options={YEAR_OPTIONS}
                  onChange={setYear}
                  style={{ flex: 1 }}
                />
                <SelectField
                  label="Major / Field"
                  value={major}
                  options={MAJOR_OPTIONS}
                  onChange={setMajor}
                  style={{ flex: 1 }}
                />
              </View>
              <LabeledInput
                label="Career Goals"
                value={careerGoals}
                onChangeText={setCareerGoals}
                placeholder="e.g. Software Engineer, AI Researcher"
              />
            </SectionCard>

            <CompactTagCard
              title="Skills"
              subtitle="Tools, languages & capabilities you want to develop"
              selectedTags={currentSkills}
              field="skills"
              onRemoveTag={handleRemoveSkill}
              color="primary"
              emptyText="No skills selected yet. Tap below to choose."
            />

            <CompactTagCard
              title="Interests"
              subtitle="Fields and research topics you want to explore"
              selectedTags={currentInterests}
              field="interests"
              onRemoveTag={handleRemoveInterest}
              color="accentPurple"
              emptyText="No interests selected yet. Tap below to choose."
            />
          </>
        )}

        {/* MENTOR SECTION - ONLY VISIBLE TO MENTORS */}
        {role === 'MENTOR' && (
          <>
            <SectionCard title="Professional Experience">
              <LabeledInput
                label="Current Job Title"
                value={jobTitle}
                onChangeText={setJobTitle}
                placeholder="e.g. Senior Software Engineer"
              />
              <LabeledInput
                label="Company / Organisation"
                value={company}
                onChangeText={setCompany}
                placeholder="e.g. Google, Atlassian"
              />
              <View style={styles.row}>
                <View style={{ flex: 2 }}>
                  <LabeledInput
                    label="Industry"
                    value={industry}
                    onChangeText={setIndustry}
                    placeholder="e.g. Technology"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <LabeledInput
                    label="Years Exp."
                    value={yearsExperience}
                    onChangeText={setYearsExperience}
                    placeholder="5"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </SectionCard>

            <CompactTagCard
              title="Mentorship Expertise"
              subtitle="Topics you can guide students on"
              selectedTags={currentExpertise}
              field="expertise"
              onRemoveTag={handleRemoveExpertise}
              color="accentPurple"
              emptyText="No expertise topics selected yet. Tap below to choose."
            />

            <SectionCard title="Social Links">
              <SocialLinkInput
                platform="linkedin"
                label="LinkedIn Profile"
                placeholder="linkedin.com/in/username"
                value={socialLinks.linkedin}
                onChangeText={(text) => setSocialLinks({ ...socialLinks, linkedin: text })}
              />
            </SectionCard>
          </>
        )}

        <PrimaryButton
          label={isNew ? 'Finish Setup' : 'Save Changes'}
          loading={isSaving}
          disabled={isSaving}
          onPress={handleSave}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F3F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontWeight: '700',
    fontSize: 16,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  titleBlock: {
    marginBottom: 8,
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
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  errorCardTitle: {
    color: '#991B1B',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorCardText: {
    color: '#7F1D1D',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});
