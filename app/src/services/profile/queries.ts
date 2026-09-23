import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { getProfile } from './api';
import { profileKeys } from './keys';
import { UserProfile } from './types';

/**
 * Fetch the authenticated user's profile.
 * `data` is null when the user has not created a profile yet — that is a
 * valid state, not an error, so callers should render an empty state for it.
 */
export function useProfileQuery(
  options?: Omit<UseQueryOptions<UserProfile | null, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: profileKeys.current(),
    queryFn: getProfile,
    ...options,
  });
}
