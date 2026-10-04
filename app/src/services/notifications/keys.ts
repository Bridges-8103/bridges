export const notificationKeys = {
  all: ['notifications'] as const,
  tokens: () => [...notificationKeys.all, 'tokens'] as const,
};
