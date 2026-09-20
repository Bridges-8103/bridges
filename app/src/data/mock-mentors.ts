import type { Mentor, MentorMatch, StudentPreferences } from '@/types/matching';
import type { FieldCategory, UpcomingSession } from '@/types/home';

export const mockFieldCategories: FieldCategory[] = [
  {
    id: 'engineering',
    title: 'Engineering',
    icon: '⚙️',
    bgColor: '#F3F4F8',
  },
  {
    id: 'design',
    title: 'Design',
    icon: '🎨',
    bgColor: '#FFF1F2',
  },
  {
    id: 'finance',
    title: 'Finance',
    icon: '📈',
    bgColor: '#EFF6FF',
  },
  {
    id: 'medicine',
    title: 'Medicine',
    icon: '🩺',
    bgColor: '#F5F3FF',
  },
];

export const mockMentors: Mentor[] = [
  {
    id: 'mentor-1',
    name: 'Dr. Priya Nair',
    jobTitle: 'ML Research Lead',
    company: 'DeepMind',
    expertise: ['Machine Learning', 'Python', 'AI Research', 'Computer Vision'],
    industry: 'Technology & AI',
    experienceYears: 8,
    careerAreas: ['Machine Learning', 'AI Research'],
    availability: 'Available',
    avatarUri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=256&h=256&fit=crop&crop=faces',
    rating: 4.9,
    sessionCount: 142,
    isOnline: true,
  },
  {
    id: 'mentor-2',
    name: 'Marcus Okonkwo',
    jobTitle: 'Senior Engineer',
    company: 'Stripe',
    expertise: ['Backend', 'Distributed Systems', 'Cloud Computing', 'Go'],
    industry: 'Software Engineering',
    experienceYears: 7,
    careerAreas: ['Distributed Systems', 'Cloud Security'],
    availability: 'Available',
    avatarUri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
    rating: 4.8,
    sessionCount: 89,
    isOnline: true,
  },
  {
    id: 'mentor-3',
    name: 'Sofia Alvarez',
    jobTitle: 'IP Attorney',
    company: 'Venture Law Partners',
    expertise: ['Law', 'Intellectual Property', 'Patent Law', 'Contracts'],
    industry: 'Legal & Compliance',
    experienceYears: 6,
    careerAreas: ['Intellectual Property', 'Corporate Law'],
    availability: 'Available',
    avatarUri: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=256&h=256&fit=crop&crop=faces',
    rating: 5.0,
    sessionCount: 64,
    isOnline: false,
  },
  {
    id: 'mentor-4',
    name: 'Sarah Chen',
    jobTitle: 'Cloud Security Architect',
    company: 'AWS',
    expertise: ['Cloud Computing', 'Cybersecurity', 'DevOps', 'System Architecture'],
    industry: 'Cloud & Infrastructure',
    experienceYears: 9,
    careerAreas: ['Cloud Security', 'DevOps'],
    availability: 'Available',
    avatarUri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=256&h=256&fit=crop&crop=faces',
    rating: 4.9,
    sessionCount: 118,
    isOnline: true,
  },
  {
    id: 'mentor-5',
    name: 'David Kim',
    jobTitle: 'Principal Product Designer',
    company: 'Figma',
    expertise: ['Design Systems', 'UI/UX', 'Product Strategy', 'Figma'],
    industry: 'Design',
    experienceYears: 10,
    careerAreas: ['Product Design', 'UX Research'],
    availability: 'Available',
    avatarUri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces',
    rating: 4.9,
    sessionCount: 175,
    isOnline: true,
  },
];

export const mockNextSession: UpcomingSession = {
  id: 'session-1',
  title: 'Career Path Review',
  mentorName: 'Dr. Priya Nair',
  mentorAvatarUri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=256&h=256&fit=crop&crop=faces',
  time: 'Today at 3:00 PM',
  zoomUrl: 'https://zoom.us/j/123456789',
};

/**
 * Rule-based weighted scoring algorithm from BRIDGES_CONTEXT.MD (Section 8)
 * Match Score =
 *   Expertise Match * 50%
 *   + Career Goal Match * 25%
 *   + Industry Match * 15%
 *   + Availability * 10%
 */
export function calculateMentorMatches(
  preferences: StudentPreferences,
  mentors: Mentor[] = mockMentors
): MentorMatch[] {
  const matches: MentorMatch[] = mentors.map((mentor) => {
    let score = 0;
    const reasons: string[] = [];

    // 1. Expertise match (up to 50 pts)
    const matchingInterests = preferences.interests.filter((interest) =>
      mentor.expertise.some((e) => e.toLowerCase().includes(interest.toLowerCase()) || interest.toLowerCase().includes(e.toLowerCase()))
    );

    if (preferences.interests.length > 0) {
      const expertiseRatio = matchingInterests.length / preferences.interests.length;
      const expertisePoints = Math.round(Math.min(1, expertiseRatio) * 50);
      score += expertisePoints;
      if (matchingInterests.length > 0) {
        reasons.push(`${matchingInterests.slice(0, 2).join(', ')} expertise`);
      }
    } else {
      score += 35; // baseline
    }

    // 2. Career Goal match (up to 25 pts)
    if (preferences.careerGoal) {
      const goalMatch = mentor.careerAreas.some((c) =>
        c.toLowerCase().includes(preferences.careerGoal.toLowerCase()) ||
        preferences.careerGoal.toLowerCase().includes(c.toLowerCase())
      ) || mentor.jobTitle.toLowerCase().includes(preferences.careerGoal.toLowerCase());

      if (goalMatch) {
        score += 25;
        reasons.push('Relevant career experience');
      } else {
        score += 10;
      }
    } else {
      score += 20;
    }

    // 3. Industry Match (up to 15 pts)
    if (preferences.industryPreference) {
      if (
        mentor.industry.toLowerCase().includes(preferences.industryPreference.toLowerCase()) ||
        preferences.industryPreference.toLowerCase().includes(mentor.industry.toLowerCase())
      ) {
        score += 15;
        reasons.push(`${mentor.industry} industry fit`);
      } else {
        score += 5;
      }
    } else {
      score += 12;
    }

    // 4. Availability (up to 10 pts)
    if (mentor.availability === 'Available') {
      score += 10;
    } else {
      score += 5;
    }

    // Clamp score to 99% max for realism
    const finalScore = Math.min(99, Math.max(60, score));

    if (reasons.length === 0) {
      reasons.push('Strong professional background', 'High student ratings');
    }

    return {
      mentor,
      score: finalScore,
      reasons,
    };
  });

  return matches.sort((a, b) => b.score - a.score);
}
