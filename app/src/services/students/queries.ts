import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { getStudents } from './api';
import { studentKeys } from './keys';
import type { StudentListQuery, StudentListResponse } from './types';

export function useStudentsQuery(
  query?: StudentListQuery,
  options?: Omit<UseQueryOptions<StudentListResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: studentKeys.list(query),
    queryFn: () => getStudents(query),
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  });
}
