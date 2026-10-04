import { api } from '@/services/api';
import type { ApiEnvelope } from '@/services/profile/types';
import type {
  RegisterPushTokenInput,
  StoredPushToken,
  UnregisterPushTokenInput,
} from './types';

function unwrap<T>(body: ApiEnvelope<T>): T | null {
  return body?.data ?? null;
}

/**
 * Register a device Expo push token with the backend.
 */
export const registerPushToken = async (
  input: RegisterPushTokenInput
): Promise<StoredPushToken | null> => {
  const response = await api.post<ApiEnvelope<StoredPushToken>>(
    '/api/notifications/tokens',
    input
  );
  return unwrap(response.data);
};

/**
 * Unregister a device push token from the backend (e.g. upon logout).
 */
export const unregisterPushToken = async (
  input: UnregisterPushTokenInput
): Promise<{ success: boolean } | null> => {
  const response = await api.delete<ApiEnvelope<{ success: boolean }>>(
    '/api/notifications/tokens',
    { data: input }
  );
  return unwrap(response.data);
};
