import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { createProfile, updateProfile } from './api';
import { profileKeys } from './keys';
import { CreateProfileInput, UpdateProfileInput, UserProfile } from './types';

/** Variables for an update: either input directly or wrapped with id. */
export interface UpdateProfileVariables {
  id?: string;
  input: UpdateProfileInput;
}

export type UpdateProfileParam = UpdateProfileVariables | UpdateProfileInput;

/**
 * Update the authenticated user's profile, then refresh the cached copy.
 */
export function useUpdateProfileMutation(
  options?: UseMutationOptions<UserProfile | null, Error, UpdateProfileParam>
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: (variables: UpdateProfileParam) => {
      if ('input' in variables) {
        return updateProfile(variables.input, variables.id);
      }
      return updateProfile(variables);
    },
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
