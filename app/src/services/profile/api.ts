import { api } from '@/services/api';
import {
  ApiEnvelope,
  CreateProfileInput,
  EmptyProfilePayload,
  UpdateProfileInput,
  UserProfile,
} from './types';

/**
 * Every backend route wraps its payload in { status, data, message }.
 * Axios also wraps the HTTP body in `.data`, so the profile itself lives at
 * `response.data.data` — unwrap once here so callers get a plain entity.
 */
function unwrap<T>(body: ApiEnvelope<T>): T | null {
  return body?.data ?? null;
}

/**
 * A profile that has not been created yet comes back as a placeholder object
 * rather than null, so discriminate on the presence of entity fields.
 */
function isProfile(value: UserProfile | EmptyProfilePayload | null): value is UserProfile {
  return Boolean(value && 'id' in value && 'displayName' in value);
}

/**
 * Fetch the authenticated user's profile.
 * Resolves to null when the user has not created one yet.
 */
export const getProfile = async (): Promise<UserProfile | null> => {
  const response = await api.get<ApiEnvelope<UserProfile | EmptyProfilePayload>>('/api/profile');
  const payload = unwrap(response.data);
  return isProfile(payload) ? payload : null;
};

export const createProfile = async (input: CreateProfileInput): Promise<UserProfile | null> => {
  const response = await api.post<ApiEnvelope<UserProfile>>('/api/profile', input);
  return unwrap(response.data);
};

/**
 * Update the authenticated user's profile.
 * Uses collection-level PATCH /api/profile or /api/profile/:id when provided.
 */
export const updateProfile = async (
  input: UpdateProfileInput,
  id?: string
): Promise<UserProfile | null> => {
  const url = id ? `/api/profile/${encodeURIComponent(id)}` : '/api/profile';
  const response = await api.patch<ApiEnvelope<UserProfile>>(url, input);
  return unwrap(response.data);
};
