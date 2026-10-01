import { api } from '@/services/api';
import type { ApiEnvelope } from '@/services/profile/types';
import type { TaxonomyCategory, TaxonomyQueryParams } from './types';

export const getTaxonomy = async (
  params?: TaxonomyQueryParams
): Promise<TaxonomyCategory[]> => {
  const response = await api.get<ApiEnvelope<TaxonomyCategory[]>>('/api/taxonomy', {
    params: {
      type: params?.type,
      category: params?.category,
      search: params?.search,
    },
  });
  return response.data?.data ?? [];
};
