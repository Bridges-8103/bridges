import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { registerPushToken, unregisterPushToken } from './api';
import type { RegisterPushTokenInput, StoredPushToken, UnregisterPushTokenInput } from './types';

/**
 * Mutation hook to register device push token with the backend.
 */
export function useRegisterPushTokenMutation(
  options?: UseMutationOptions<StoredPushToken | null, Error, RegisterPushTokenInput>
) {
  return useMutation({
    ...options,
    mutationFn: registerPushToken,
  });
}

/**
 * Mutation hook to unregister device push token upon logout.
 */
export function useUnregisterPushTokenMutation(
  options?: UseMutationOptions<{ success: boolean } | null, Error, UnregisterPushTokenInput>
) {
  return useMutation({
    ...options,
    mutationFn: unregisterPushToken,
  });
}
