import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import {
  getConnectionRequests,
  getConnections,
  getConnectionStatus,
} from './api';
import { connectionKeys } from './keys';
import type {
  ConnectionListQuery,
  ConnectionListResponse,
  ConnectionRequestsResponse,
  ConnectionStatusResponse,
} from './types';

export function useConnectionStatusQuery(
  targetUserId: string | number,
  options?: Omit<UseQueryOptions<ConnectionStatusResponse, Error>, 'queryKey' | 'queryFn'>
) {
  const enabled = Boolean(targetUserId) && (options?.enabled ?? true);
  return useQuery({
    queryKey: connectionKeys.status(targetUserId),
    queryFn: () => getConnectionStatus(targetUserId),
    enabled,
    staleTime: 1000 * 30, // 30s
    ...options,
  });
}

export function useConnectionsQuery(
  query?: ConnectionListQuery,
  options?: Omit<UseQueryOptions<ConnectionListResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: connectionKeys.list(query),
    queryFn: () => getConnections(query),
    staleTime: 1000 * 60, // 1 minute
    ...options,
  });
}

export function useConnectionRequestsQuery(
  options?: Omit<UseQueryOptions<ConnectionRequestsResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: connectionKeys.requests(),
    queryFn: getConnectionRequests,
    staleTime: 1000 * 30, // 30s
    ...options,
  });
}
