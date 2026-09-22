import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { getProfile } from './api';
import { profileKeys } from './keys';
import { UserProfile } from './types';

/**
 * Example useQuery Hook: Fetch profile with TanStack Query and axios
 */
export function useProfileQuery(
  options?: Omit<UseQueryOptions<UserProfile, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: profileKeys.current(),
    queryFn: getProfile,
    ...options,
  });
}
