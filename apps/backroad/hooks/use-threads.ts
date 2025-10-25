'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useThreadFiltersStore } from '@/hooks/use-thread-filters';

export function useThreads() {
  const filters = useThreadFiltersStore((state) => state);
  return useQuery({
    queryKey: ['threads', filters.query, filters.tag],
    queryFn: async () => {
      if (filters.query || filters.tag) {
        return apiClient.search({ query: filters.query, tag: filters.tag });
      }
      return apiClient.getThreads();
    },
  });
}
