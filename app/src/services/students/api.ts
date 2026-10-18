import { api } from '@/services/api';
import type { ApiEnvelope } from '@/services/profile/types';
import type { StudentListQuery, StudentListResponse } from './types';

export const getStudents = async (
  query?: StudentListQuery
): Promise<StudentListResponse> => {
  const response = await api.get<ApiEnvelope<StudentListResponse>>('/api/students', {
    params: query,
  });

  return (
    response.data?.data ?? {
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    }
  );
};
