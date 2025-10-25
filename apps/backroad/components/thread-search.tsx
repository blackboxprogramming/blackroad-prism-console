'use client';

import { FormEvent, useState } from 'react';
import { useThreadFiltersStore } from '@/hooks/use-thread-filters';

const TAG_OPTIONS = ['campfire', 'intro', 'practice', 'safety', 'ideas'];

export function ThreadFilters() {
  const { query, tag, setQuery, setTag, clear } = useThreadFiltersStore((state) => state);
  const [localQuery, setLocalQuery] = useState(query);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(localQuery);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-4"
      aria-label="Filter threads"
    >
      <label className="flex-1 text-sm text-slate-300" htmlFor="thread-search">
        <span className="sr-only">Search threads</span>
        <input
          id="thread-search"
          type="search"
          value={localQuery}
          onChange={(event) => setLocalQuery(event.target.value)}
          placeholder="Search thread titles"
          className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-brand-400 focus:outline-none"
        />
      </label>
      <label className="text-sm text-slate-300" htmlFor="thread-tag">
        <span className="sr-only">Filter by tag</span>
        <select
          id="thread-tag"
          value={tag ?? ''}
          onChange={(event) => setTag(event.target.value || undefined)}
          className="rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-brand-400 focus:outline-none"
        >
          <option value="">All tags</option>
          {TAG_OPTIONS.map((option) => (
            <option key={option} value={option}>
              #{option}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="rounded-full bg-brand-500/20 px-4 py-2 text-xs font-semibold text-brand-100 hover:bg-brand-500/30"
      >
        Apply
      </button>
      <button
        type="button"
        onClick={() => {
          setLocalQuery('');
          clear();
        }}
        className="text-xs text-slate-300 underline-offset-4 hover:underline"
      >
        Reset
      </button>
    </form>
  );
}
