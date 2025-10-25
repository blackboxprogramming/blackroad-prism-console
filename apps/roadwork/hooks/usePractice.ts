'use client';

import { useQuery } from '@tanstack/react-query';
import { questionsResponseSchema, type Question } from '@/lib/schemas';

async function fetchPractice(slug: string): Promise<Question[]> {
  const res = await fetch(`/api/lessons/${slug}/questions`);
  const json = await res.json();
  return questionsResponseSchema.parse(json).questions;
}

export function usePractice(slug: string) {
  return useQuery({
    queryKey: ['practice', slug],
    queryFn: () => fetchPractice(slug),
    enabled: Boolean(slug)
  });
}
