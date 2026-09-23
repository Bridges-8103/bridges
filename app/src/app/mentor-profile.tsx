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
import { MAJOR_OPTIONS, YEAR_OPTIONS } from '@/data/mock-mentor-profile';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useCreateProfileMutation, useUpdateProfileMutation } from '@/services/profile/mutations';
import { useProfileQuery } from '@/services/profile/queries';
import type { UserProfile } from '@/services/profile/types';
import type { SocialLinks, Tag } from '@/types/mentor-profile';

const BIO_MAX_LENGTH = 250;

const DEFAULT_STUDENT_SKILLS: Tag[] = [
  { id: 'react', label: 'React', selected: true },
  { id: 'typescript', label: 'TypeScript', selected: true },
  { id: 'python', label: 'Python', selected: true },
  { id: 'react-native', label: 'React Native', selected: false },
  { id: 'java', label: 'Java', selected: false },
  { id: 'c-plus-plus', label: 'C++', selected: false },
  { id: 'swift', label: 'Swift & iOS', selected: false },
  { id: 'machine-learning', label: 'Machine Learning', selected: false },
  { id: 'ai-engineering', label: 'AI Engineering', selected: false },
  { id: 'data-analysis', label: 'Data Analysis', selected: false },
  { id: 'sql-databases', label: 'SQL & Databases', selected: false },
  { id: 'cloud-devops', label: 'Cloud & DevOps', selected: false },
  { id: 'system-design', label: 'System Design', selected: false },
  { id: 'product-management', label: 'Product Management', selected: false },
  { id: 'ui-ux-design', label: 'UI/UX Design', selected: false },
  { id: 'cybersecurity', label: 'Cybersecurity', selected: false },
  { id: 'public-speaking', label: 'Public Speaking', selected: false },
];

const DEFAULT_INTERESTS: Tag[] = [
  { id: 'ai-ml', label: 'AI & ML', selected: true },
  { id: 'startups', label: 'Startups & Ventures', selected: true },
  { id: 'career-growth', label: 'Career Growth', selected: true },
  { id: 'open-source', label: 'Open Source', selected: false },
  { id: 'fintech', label: 'FinTech', selected: false },
  { id: 'healthtech', label: 'HealthTech & Bio', selected: false },
  { id: 'climate-tech', label: 'Climate & CleanTech', selected: false },
  { id: 'web3', label: 'Web3 & Crypto', selected: false },
  { id: 'product-strategy', label: 'Product Strategy', selected: false },
  { id: 'design-creative', label: 'Design & Creative', selected: false },
  { id: 'venture-capital', label: 'Venture Capital', selected: false },
  { id: 'academic-research', label: 'Academic Research', selected: false },
  { id: 'social-impact', label: 'Social Impact', selected: false },
];

const DEFAULT_MENTOR_EXPERTISE: Tag[] = [
  { id: 'system-architecture', label: 'System Architecture', selected: true },
  { id: 'career-coaching', label: 'Career Coaching', selected: true },
  { id: 'interview-prep', label: 'Interview Prep', selected: true },
  { id: 'resume-review', label: 'Resume & Portfolio Review', selected: true },
  { id: 'frontend-dev', label: 'Frontend Development', selected: false },
  { id: 'backend-distributed', label: 'Backend & Distributed Systems', selected: false },
  { id: 'cloud-devops', label: 'Cloud & DevOps', selected: false },
  { id: 'team-leadership', label: 'Engineering Leadership', selected: false },
  { id: 'ai-engineering', label: 'AI Engineering & LLMs', selected: false },
  { id: 'product-strategy', label: 'Product Strategy & Roadmaps', selected: false },
  { id: 'startup-pitching', label: 'Startup Pitching & Funding', selected: false },
  { id: 'cross-functional', label: 'Cross-Functional Collaboration', selected: false },
];

export default function MentorProfileScreen() {
  const { data: profile, isLoading } = useProfileQuery();
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

  return (
    <AdaptiveProfileForm
      key={profile?.id ?? 'new-profile'}
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

  // Tags
  const [skills, setSkills] = useState<Tag[]>(() => {
    if (profile?.studentDetail?.skills?.length) {
      return DEFAULT_STUDENT_SKILLS.map((tag) => ({
        ...tag,
        selected: profile.studentDetail!.skills.includes(tag.label),
      }));
    }
    return DEFAULT_STUDENT_SKILLS;
  });

  const [interests, setInterests] = useState<Tag[]>(() => {
    if (profile?.studentDetail?.interests?.length) {
      return DEFAULT_INTERESTS.map((tag) => ({
        ...tag,
        selected: profile.studentDetail!.interests.includes(tag.label),
      }));
    }
    return DEFAULT_INTERESTS;
  });

  const [expertise, setExpertise] = useState<Tag[]>(() => {
    if (profile?.mentorDetail?.expertise?.length) {
      return DEFAULT_MENTOR_EXPERTISE.map((tag) => ({
        ...tag,
        selected: profile.mentorDetail!.expertise.includes(tag.label),
      }));
    }
    return DEFAULT_MENTOR_EXPERTISE;
  });

  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    linkedin: profile?.mentorDetail?.linkedinUrl || '',
    github: '',
    twitter: '',
  });

  const toggleTag = (list: Tag[], setList: (tags: Tag[]) => void, id: string) => {
    setList(list.map((tag) => (tag.id === id ? { ...tag, selected: !tag.selected } : tag)));
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Missing Name', 'Please provide your full name.');
      return;
    }

    const selectedSkills = skills.filter((s) => s.selected).map((s) => s.label);
    const selectedInterests = interests.filter((i) => i.selected).map((i) => i.label);
    const selectedExpertise = expertise.filter((e) => e.selected).map((e) => e.label);

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

            <SectionCard title="Skills" subtitle="Tap to add or remove skills">
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

            <SectionCard title="Interests" subtitle="Areas you want to explore">
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

            <SectionCard title="Mentorship Expertise" subtitle="Topics you can guide students on">
              <View style={styles.chipRow}>
                {expertise.map((tag) => (
                  <ChipToggle
                    key={tag.id}
                    label={tag.label}
                    selected={tag.selected}
                    color="accentPurple"
                    onPress={() => toggleTag(expertise, setExpertise, tag.id)}
                  />
                ))}
              </View>
            </SectionCard>

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
});
