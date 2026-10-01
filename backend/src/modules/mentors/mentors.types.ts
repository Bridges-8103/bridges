export interface MentorDto {
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

export interface MentorListQuery {
  search?: string;
  category?: string;
  skills?: string[];
  page?: number;
  limit?: number;
}

export interface MentorListResponse {
  items: MentorDto[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface MentorMatchDto {
  mentor: MentorDto;
  score: number;
  matchReasons: string[];
  matchingInterests: string[];
}
