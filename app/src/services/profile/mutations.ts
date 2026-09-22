import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { createProfile, updateProfile } from './api';
import { profileKeys } from './keys';
import { CreateProfileInput, UpdateProfileInput, UserProfile } from './types';

/**
 * Example useMutation Hook: Update profile with TanStack Query and axios
 */
export function useUpdateProfileMutation(
  options?: UseMutationOptions<UserProfile, Error, UpdateProfileInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: updateProfile,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.current() });
      await options?.onSuccess?.(...args);
    },
  });
}

/**
 * Example useMutation Hook: Create profile with TanStack Query and axios
 */
export function useCreateProfileMutation(
  options?: UseMutationOptions<UserProfile, Error, CreateProfileInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: createProfile,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.current() });
      await options?.onSuccess?.(...args);
    },
  });
}
