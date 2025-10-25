'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export function useRooms() {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: () => apiClient.getRooms(),
  });
}
