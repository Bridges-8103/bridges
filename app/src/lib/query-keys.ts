/**
 * Centralized Query Key Factory
 *
 * Use these factories for consistent query caching and invalidation with TanStack Query.
 */
export const queryKeys = {
  mentors: {
    all: ['mentors'] as const,
    lists: () => [...queryKeys.mentors.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.mentors.lists(), filters] as const,
    details: () => [...queryKeys.mentors.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.mentors.details(), id] as const,
  },
  sessions: {
    all: ['sessions'] as const,
    lists: () => [...queryKeys.sessions.all, 'list'] as const,
    list: (status?: string) => [...queryKeys.sessions.lists(), status] as const,
    detail: (id: string) => [...queryKeys.sessions.all, 'detail', id] as const,
  },
  user: {
    all: ['user'] as const,
    profile: (userId?: string) => [...queryKeys.user.all, 'profile', userId] as const,
  },
};
