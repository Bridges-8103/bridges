import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { getMentorById, getMentors, getSuggestedMentors } from './api';
import { mentorKeys } from './keys';
import type {
  MentorListResponse,
  MentorMatchItem,
  MentorProfile,
  MentorQueryParams,
} from './types';

export function useMentorsQuery(
  params?: MentorQueryParams,
  options?: Omit<UseQueryOptions<MentorListResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: mentorKeys.list(params),
    queryFn: () => getMentors(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

export function useMentorDetailQuery(
  id: string,
  options?: Omit<UseQueryOptions<MentorProfile | null, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: mentorKeys.detail(id),
    queryFn: () => getMentorById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 10, // 10 minutes
    ...options,
  });
}

export function useSuggestedMentorsQuery(
  interests?: string[],
  limit = 10,
  options?: Omit<UseQueryOptions<MentorMatchItem[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: mentorKeys.suggestions(interests),
    queryFn: () => getSuggestedMentors(interests, limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}
