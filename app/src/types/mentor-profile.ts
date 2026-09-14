export type Tag = {
  id: string;
  label: string;
  selected: boolean;
};

export type SocialLinks = {
  linkedin: string;
  github: string;
  twitter: string;
};

export type MentorProfile = {
  avatarUri: string;
  fullName: string;
  bio: string;
  university: string;
  year: string;
  major: string;
  skills: Tag[];
  interests: Tag[];
  socialLinks: SocialLinks;
};
