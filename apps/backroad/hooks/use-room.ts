'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export function useRoom(roomId: string) {
  return useQuery({
    queryKey: ['room', roomId],
    queryFn: () => apiClient.getRoom(roomId),
  });
}
