import type { Mentor } from './matching';

export type UpcomingSession = {
  id: string;
  title: string;
  mentorName: string;
  mentorAvatarUri?: string;
  time: string;
  zoomUrl?: string;
};

export type FieldCategory = {
  id: string;
  title: string;
  icon: string;
  bgColor?: string;
};

export type HomeData = {
  greeting: string;
  userName: string;
  userAvatarUri: string;
  isOnline: boolean;
  nextSession: UpcomingSession;
  categories: FieldCategory[];
  topMentors: Mentor[];
};
