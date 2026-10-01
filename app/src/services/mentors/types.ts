export interface MentorProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  bio?: string | null;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  jobTitle?: string | null;
  company?: string | null;
  industry?: string | null;
  yearsExperience?: number | null;
  expertise: string[];
  preferredEnquiries: string[];
  linkedinUrl?: string | null;
  contactEmail?: string | null;
  rating: number;
}

export interface MentorQueryParams {
  search?: string;
  category?: string;
  skills?: string[];
  page?: number;
  limit?: number;
}

export interface MentorListResponse {
  items: MentorProfile[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface MentorMatchItem {
  mentor: MentorProfile;
  score: number;
  matchReasons: string[];
  matchingInterests: string[];
}
