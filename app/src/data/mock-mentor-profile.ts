import type { MentorProfile } from '@/types/mentor-profile';

export const YEAR_OPTIONS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Graduate'];

export const MAJOR_OPTIONS = [
  'Computer Science',
  'Electrical Engineering',
  'Mathematics',
  'Business',
  'Design',
];

export const mockMentorProfile: MentorProfile = {
  avatarUri:
    'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=256&h=256&fit=crop&crop=faces',
  fullName: 'Jamie Chen',
  bio: 'Aspiring ML engineer passionate about intelligent systems. Looking for mentors in AI research and tech startups.',
  university: 'Stanford University',
  year: 'Year 3',
  major: 'Computer Science',
  skills: [
    { id: 'react', label: 'React', selected: true },
    { id: 'machine-learning', label: 'Machine Learning', selected: true },
    { id: 'python', label: 'Python', selected: true },
    { id: 'data-analysis', label: 'Data Analysis', selected: true },
    { id: 'system-design', label: 'System Design', selected: true },
    { id: 'typescript', label: 'TypeScript', selected: true },
    { id: 'java', label: 'Java', selected: false },
    { id: 'product-management', label: 'Product Management', selected: false },
    { id: 'ux-research', label: 'UX Research', selected: false },
    { id: 'finance', label: 'Finance', selected: false },
    { id: 'public-speaking', label: 'Public Speaking', selected: false },
  ],
  interests: [
    { id: 'ai-ml', label: 'AI & ML', selected: true },
    { id: 'startups', label: 'Startups', selected: true },
    { id: 'open-source', label: 'Open Source', selected: true },
    { id: 'career-growth', label: 'Career Growth', selected: true },
    { id: 'distributed-systems', label: 'Distributed Systems', selected: false },
    { id: 'design', label: 'Design', selected: false },
    { id: 'venture-capital', label: 'Venture Capital', selected: false },
    { id: 'research', label: 'Research', selected: false },
    { id: 'web3', label: 'Web3', selected: false },
  ],
  socialLinks: {
    linkedin: 'linkedin.com/in/jamiechen',
    github: 'github.com/jamiechen',
    twitter: '',
  },
};
