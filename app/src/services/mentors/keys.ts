import type { MentorQueryParams } from './types';

export const mentorKeys = {
  all: ['mentors'] as const,
  lists: () => [...mentorKeys.all, 'list'] as const,
  list: (params?: MentorQueryParams) => [...mentorKeys.lists(), params] as const,
  details: () => [...mentorKeys.all, 'detail'] as const,
  detail: (id: string) => [...mentorKeys.details(), id] as const,
  suggestions: (interests?: string[]) =>
    [...mentorKeys.all, 'suggestions', ...(interests ?? [])] as const,
};
