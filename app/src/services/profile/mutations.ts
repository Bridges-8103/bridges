import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { createProfile, updateProfile } from './api';
import { profileKeys } from './keys';
import { CreateProfileInput, UpdateProfileInput, UserProfile } from './types';

/** Variables for an update: the backend patches by profile ID. */
export interface UpdateProfileVariables {
  id: string;
  input: UpdateProfileInput;
}

/**
 * Update the authenticated user's profile, then refresh the cached copy.
 */
export function useUpdateProfileMutation(
  options?: UseMutationOptions<UserProfile | null, Error, UpdateProfileVariables>
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: ({ id, input }: UpdateProfileVariables) => updateProfile(id, input),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.current() });
      await options?.onSuccess?.(...args);
    },
  });
}

/**
 * Create a profile for the authenticated user, then refresh the cached copy.
 */
export function useCreateProfileMutation(
  options?: UseMutationOptions<UserProfile | null, Error, CreateProfileInput>
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
