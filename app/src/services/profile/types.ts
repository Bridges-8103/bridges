/**
 * Types for Profile Service
 *
 * These mirror the backend contract defined in
 * backend/src/modules/profile/profile.schema.ts. Keep them in sync —
 * the backend is the source of truth.
 */

/** Standard envelope returned by the backend's sendResponse() helper. */
export interface ApiEnvelope<T> {
  status: number;
  data: T | null;
  message: string;
  errors?: unknown;
}

export interface StudentDetail {
  university?: string | null;
  degree?: string | null;
  fieldOfStudy?: string | null;
  yearOfStudy?: number | null;
  interests: string[];
  skills: string[];
  careerGoals?: string | null;
}

export interface MentorDetail {
  jobTitle?: string | null;
  company?: string | null;
  industry?: string | null;
  yearsExperience?: number | null;
  expertise: string[];
  preferredEnquiries: string[];
  linkedinUrl?: string | null;
}

/** A persisted profile entity. */
export interface UserProfile {
  id: string;
  userId: string;
  email?: string;
  displayName: string;
  role: 'STUDENT' | 'MENTOR';
  bio?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  studentDetail?: StudentDetail | null;
  mentorDetail?: MentorDetail | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /api/profile returns this placeholder payload instead of a profile
 * when the authenticated user has not created one yet.
 */
export interface EmptyProfilePayload {
  userId: string;
  email?: string;
  profile: null;
  message: string;
}

export interface CreateProfileInput {
  userId: string;
  displayName: string;
  email?: string;
  role?: 'STUDENT' | 'MENTOR';
  bio?: string;
  avatarUrl?: string;
  phoneNumber?: string;

  // Student details
  university?: string;
  degree?: string;
  fieldOfStudy?: string;
  yearOfStudy?: number;
  interests?: string[];
  skills?: string[];
  careerGoals?: string;

  // Mentor details
  jobTitle?: string;
  company?: string;
  industry?: string;
  yearsExperience?: number;
  expertise?: string[];
  preferredEnquiries?: string[];
  linkedinUrl?: string;
}

export interface UpdateProfileInput {
  displayName?: string;
  role?: 'STUDENT' | 'MENTOR';
  bio?: string;
  avatarUrl?: string;
  phoneNumber?: string;

  // Student details
  university?: string;
  degree?: string;
  fieldOfStudy?: string;
  yearOfStudy?: number;
  interests?: string[];
  skills?: string[];
  careerGoals?: string;

  // Mentor details
  jobTitle?: string;
  company?: string;
  industry?: string;
  yearsExperience?: number;
  expertise?: string[];
  preferredEnquiries?: string[];
  linkedinUrl?: string;
}
