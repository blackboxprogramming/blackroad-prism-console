'use client';

import { useMemo, useState } from 'react';
import { useLessons } from '@/hooks/useLessons';
import { LessonCard } from '@/components/catalog/LessonCard';
import { TagPills } from '@/components/catalog/TagPills';
import { SearchBar } from '@/components/catalog/SearchBar';
import { SortSelect } from '@/components/catalog/SortSelect';
import { ToastLiveRegion } from '@/components/navigation/ToastLiveRegion';
import { useTelemetry } from '@/hooks/useTelemetry';

export default function CatalogPage() {
  const { data: lessons = [], isLoading, isError } = useLessons();
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [sort, setSort] = useState<'title' | 'estMinutes'>('title');
  const { track, flush } = useTelemetry();

  const filtered = useMemo(() => {
    let next = lessons;
    if (query) {
      const lower = query.toLowerCase();
      next = next.filter((lesson) => lesson.title.toLowerCase().includes(lower));
    }
    if (tag) {
      next = next.filter((lesson) => lesson.tags.includes(tag));
    }
    return [...next].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title);
      return a.estMinutes - b.estMinutes;
    });
  }, [lessons, query, tag, sort]);

  const tags = useMemo(() => Array.from(new Set(lessons.flatMap((lesson) => lesson.tags))), [lessons]);

  const message = isError ? 'Unable to load lessons. Try again later.' : null;

  return (
    <ToastLiveRegion message={message}>
      <section className="space-y-6">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold">Lesson catalog</h1>
          <p className="text-slate-600">Search and filter lessons by topic or estimated time.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <SearchBar query={query} onChange={setQuery} />
            <SortSelect value={sort} onChange={setSort} />
          </div>
          <TagPills tags={tags} active={tag} onSelect={setTag} />
        </header>
        {isLoading ? <p>Loading lessons…</p> : null}
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((lesson) => (
            <button
              key={lesson.id}
              type="button"
              onClick={() => {
                track({ type: 'lesson_view', payload: { lessonId: lesson.id } });
                flush();
                window.location.assign(`/lesson/${lesson.slug}`);
              }}
              className="text-left"
            >
              <LessonCard lesson={lesson} />
            </button>
          ))}
        </div>
        {filtered.length === 0 && !isLoading ? (
          <p role="status">No lessons found. Adjust filters and try again.</p>
        ) : null}
      </section>
    </ToastLiveRegion>
  );
}
