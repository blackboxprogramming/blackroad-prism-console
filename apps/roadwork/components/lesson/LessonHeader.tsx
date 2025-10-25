import { formatMinutes } from '@/lib/time';
import type { Lesson } from '@/lib/schemas';

export function LessonHeader({ lesson }: { lesson: Lesson }) {
  return (
    <header className="space-y-2" aria-describedby="lesson-summary objectives-heading">
      <h1 className="text-3xl font-bold">{lesson.title}</h1>
      <p id="lesson-summary" className="text-lg text-slate-700">
        {lesson.summary}
      </p>
      <p className="text-sm text-slate-600">Estimated {formatMinutes(lesson.estMinutes)}</p>
      <div className="flex flex-wrap gap-2" aria-label="Tags">
        {lesson.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs uppercase tracking-wide">
            {tag}
          </span>
        ))}
      </div>
    </header>
  );
}
