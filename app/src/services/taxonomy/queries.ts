import { useQuery } from '@tanstack/react-query';
import { getTaxonomy } from './api';
import { taxonomyKeys } from './keys';
import type { TagType, TaxonomyCategory } from './types';

/**
 * Hook to retrieve categorized taxonomy from the backend.
 * Caches in memory with 24h stale time for optimal performance.
 */
export const useTaxonomyQuery = (type?: TagType, category?: string, search?: string) => {
  return useQuery<TaxonomyCategory[]>({
    queryKey: taxonomyKeys.list(type, category, search),
    queryFn: () => getTaxonomy({ type, category, search }),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days in cache
  });
};
