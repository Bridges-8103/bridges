/**
 * Query Key Factory for Profile Entity
 */
export const profileKeys = {
  all: ['profile'] as const,
  current: () => [...profileKeys.all, 'current'] as const,
  detail: (userId: string) => [...profileKeys.all, 'detail', userId] as const,
};
