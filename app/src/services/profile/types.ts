/**
 * Types for Profile Service
 */

export interface UserProfile {
  id: string;
  userId: string;
  name?: string;
  bio?: string;
  role?: string;
  avatarUrl?: string;
  skills?: string[];
  interests?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProfileInput {
  name: string;
  bio?: string;
  role?: string;
  skills?: string[];
  interests?: string[];
}

export interface UpdateProfileInput {
  name?: string;
  bio?: string;
  role?: string;
  skills?: string[];
  interests?: string[];
}
