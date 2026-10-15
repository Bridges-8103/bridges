import type { StudentListQuery } from './types';

export const studentKeys = {
  all: ['students'] as const,
  list: (query?: StudentListQuery) => [...studentKeys.all, 'list', query] as const,
};
