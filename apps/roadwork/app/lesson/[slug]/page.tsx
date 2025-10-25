'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLesson } from '@/hooks/useLesson';
import { LessonHeader } from '@/components/lesson/LessonHeader';
import { ObjectivesList } from '@/components/lesson/ObjectivesList';
import { ContentRenderer } from '@/components/lesson/ContentRenderer';
import { ToastLiveRegion } from '@/components/navigation/ToastLiveRegion';
import { useTelemetry } from '@/hooks/useTelemetry';

export default function LessonPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? '';
  const { data: lesson, isLoading, isError } = useLesson(slug);
  const { track, flush } = useTelemetry();

  if (isLoading) {
    return <p>Loading lesson…</p>;
  }

  return (
    <ToastLiveRegion message={isError ? 'Lesson unavailable.' : null}>
      {lesson ? (
        <div className="space-y-8">
          <LessonHeader lesson={lesson} />
          <ObjectivesList objectives={lesson.outcomes} />
          <ContentRenderer content={lesson.content} />
          <div className="flex gap-4">
            <Link
              href={`/lesson/${lesson.slug}/practice`}
              className="rounded bg-brand-500 px-4 py-2 text-white focus-visible:ring-2 focus-visible:ring-brand-300"
              onClick={() => {
                track({ type: 'practice_start', payload: { lessonId: lesson.id } });
                flush();
              }}
            >
              Start practice
            </Link>
            <Link
              href={`/lesson/${lesson.slug}/quiz`}
              className="rounded border border-brand-500 px-4 py-2 text-brand-600 focus-visible:ring-2 focus-visible:ring-brand-300"
              onClick={() => {
                track({ type: 'quiz_start', payload: { lessonId: lesson.id } });
                flush();
              }}
            >
              Take adaptive quiz
            </Link>
          </div>
        </div>
      ) : null}
    </ToastLiveRegion>
  );
}
