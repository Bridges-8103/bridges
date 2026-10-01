import type { TagType } from './types';

export const taxonomyKeys = {
  all: ['taxonomy'] as const,
  list: (type?: TagType, category?: string, search?: string) =>
    [...taxonomyKeys.all, 'list', { type: type ?? 'ALL', category: category ?? 'ALL', search: search ?? '' }] as const,
};
