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

/** A persisted profile entity. */
export interface UserProfile {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  phoneNumber?: string;
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
  bio?: string;
  avatarUrl?: string;
  phoneNumber?: string;
}

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  phoneNumber?: string;
}
