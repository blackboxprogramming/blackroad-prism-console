'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchBar } from '../components/SearchBar';

const RECENT_QUERIES_KEY = 'roadview.recentQueries';

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [recentQueries, setRecentQueries] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(RECENT_QUERIES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as string[];
        setRecentQueries(parsed.slice(0, 5));
      } catch (error) {
        console.warn('Failed to parse recent queries', error);
      }
    }
  }, []);

  const handleSubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const nextRecent = [trimmed, ...recentQueries.filter((item) => item !== trimmed)].slice(0, 5);
    setRecentQueries(nextRecent);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(RECENT_QUERIES_KEY, JSON.stringify(nextRecent));
    }
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section className="flex flex-col gap-12">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm uppercase tracking-widest text-brand-300">RoadView</p>
        <h1 className="text-4xl font-semibold text-white sm:text-5xl">Search with source transparency first.</h1>
        <p className="text-lg text-slate-300">
          RoadView helps you explore results with credibility signals front and center. Filter by source type, bias, or
          freshness and inspect provenance in a single view.
        </p>
      </header>
      <div className="w-full max-w-2xl">
        <SearchBar
          value={query}
          onChange={setQuery}
          onDebouncedChange={undefined}
          onSubmit={handleSubmit}
          placeholder="Search credible intelligence..."
        />
      </div>
      {recentQueries.length > 0 && (
        <aside aria-label="Recent queries" className="max-w-2xl space-y-2 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Recent queries</h2>
          <ul className="flex flex-wrap gap-2">
            {recentQueries.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-100 transition hover:bg-slate-700"
                  onClick={() => handleSubmit(item)}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </section>
  );
}
