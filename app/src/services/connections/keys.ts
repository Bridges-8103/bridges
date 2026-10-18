import type { ConnectionListQuery } from "./types";

export const connectionKeys = {
  all: ['connections'] as const,
  list: (query?: ConnectionListQuery) => [...connectionKeys.all, 'list', query] as const,
  requests: () => [...connectionKeys.all, 'requests'] as const,
  status: (targetUserId: string | number) =>
    [...connectionKeys.all, 'status', String(targetUserId)] as const,
};
