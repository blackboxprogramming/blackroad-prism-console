'use client';

import { useQuery } from '@tanstack/react-query';
import { lessonSchema, type Lesson } from '@/lib/schemas';

async function fetchLesson(slug: string): Promise<Lesson> {
  const res = await fetch(`/api/lessons/${slug}`);
  const json = await res.json();
  return lessonSchema.parse(json.lesson);
}

export function useLesson(slug: string) {
  return useQuery({
    queryKey: ['lesson', slug],
    queryFn: () => fetchLesson(slug),
    enabled: Boolean(slug)
  });
}
