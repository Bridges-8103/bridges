import { api } from '@/services/api';
import type { ApiEnvelope } from '@/services/profile/types';
import type {
  MentorListResponse,
  MentorMatchItem,
  MentorProfile,
  MentorQueryParams,
} from './types';

export const getMentors = async (
  params?: MentorQueryParams
): Promise<MentorListResponse> => {
  const response = await api.get<ApiEnvelope<MentorListResponse>>('/api/mentors', {
    params: {
      search: params?.search,
      category: params?.category,
      skills: params?.skills && params.skills.length > 0 ? params.skills.join(',') : undefined,
      page: params?.page,
      limit: params?.limit,
    },
  });

  return (
    response.data?.data ?? {
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      hasMore: false,
    }
  );
};

export const getMentorById = async (id: string): Promise<MentorProfile | null> => {
  const response = await api.get<ApiEnvelope<MentorProfile>>(`/api/mentors/${id}`);
  return response.data?.data ?? null;
};

export const getSuggestedMentors = async (
  interests?: string[],
  limit = 10
): Promise<MentorMatchItem[]> => {
  const response = await api.get<ApiEnvelope<MentorMatchItem[]>>('/api/mentors/suggestions', {
    params: {
      interests: interests && interests.length > 0 ? interests.join(',') : undefined,
      limit,
    },
  });

  return response.data?.data ?? [];
};
