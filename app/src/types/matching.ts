export type StudentPreferences = {
  interests: string[];
  careerGoal: string;
  industryPreference: string;
};

export type Mentor = {
  id: string;
  name: string;
  jobTitle: string;
  company: string;
  expertise: string[];
  industry: string;
  experienceYears: number;
  careerAreas: string[];
  availability: 'Available' | 'Limited';
  avatarUri?: string;
  rating?: number;
  sessionCount?: number;
  isOnline?: boolean;
};

export type MentorMatch = {
  mentor: Mentor;
  score: number;
  reasons: string[];
};
