'use client';

import { useQuery } from '@tanstack/react-query';
import { lessonsResponseSchema, type Lesson } from '@/lib/schemas';

async function fetchLessons(): Promise<Lesson[]> {
  const res = await fetch('/api/lessons');
  const json = await res.json();
  return lessonsResponseSchema.parse(json).lessons;
}

export function useLessons() {
  return useQuery({
    queryKey: ['lessons'],
    queryFn: fetchLessons,
    staleTime: 5 * 60 * 1000
  });
}
