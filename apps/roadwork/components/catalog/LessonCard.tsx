import Link from 'next/link';
import { formatMinutes } from '@/lib/time';
import type { Lesson } from '@/lib/schemas';

export function LessonCard({ lesson }: { lesson: Lesson }) {
  return (
    <article className="rounded border border-slate-200 bg-white p-4 shadow-sm focus-within:ring-2 focus-within:ring-brand-500">
      <header>
        <h2 className="text-xl font-semibold">
          <Link href={`/lesson/${lesson.slug}`} className="hover:underline">
            {lesson.title}
          </Link>
        </h2>
        <p className="mt-1 text-sm text-slate-600">Estimated {formatMinutes(lesson.estMinutes)}</p>
      </header>
      <p className="mt-3 text-slate-700">{lesson.summary}</p>
      <footer className="mt-4 flex flex-wrap items-center gap-2" aria-label="Tags">
        {lesson.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs uppercase tracking-wide">
            {tag}
          </span>
        ))}
      </footer>
    </article>
  );
}
