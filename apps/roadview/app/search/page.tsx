'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchBar } from '../../components/SearchBar';
import { FiltersPanel } from '../../components/FiltersPanel';
import { SortSelect } from '../../components/SortSelect';
import { ResultCard } from '../../components/ResultCard';
import { useFilters } from '../../hooks/useFilters';
import { loadLastQuery, useSearch } from '../../hooks/useSearch';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const filters = useFilters();
  const RECENT_QUERIES_KEY = 'roadview.recentQueries';

  const currentParam = searchParams.get('q') ?? '';

  useEffect(() => {
    if (currentParam) {
      setQuery(currentParam);
    } else if (!query) {
      setQuery(loadLastQuery());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentParam]);

  const { results, facets, isFetching, isPending, isError, error } = useSearch(query, filters.filters);

  const persistRecentQuery = (value: string) => {
    if (typeof window === 'undefined' || !value) return;
    try {
      const stored = window.localStorage.getItem(RECENT_QUERIES_KEY);
      const parsed = stored ? (JSON.parse(stored) as string[]) : [];
      const next = [value, ...parsed.filter((item) => item !== value)].slice(0, 5);
      window.localStorage.setItem(RECENT_QUERIES_KEY, JSON.stringify(next));
    } catch (error) {
      console.warn('Failed to persist recent query', error);
    }
  };

  const handleSubmit = (value: string) => {
    const trimmed = value.trim();
    setQuery(trimmed);
    persistRecentQuery(trimmed);
    router.replace(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const debouncedUpdate = (value: string) => {
    const trimmed = value.trim();
    router.replace(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const skeletonCards = useMemo(() => Array.from({ length: 3 }, (_, index) => index), []);

  return (
    <section className="grid gap-8 lg:grid-cols-[300px,1fr]">
      <FiltersPanel
        facets={facets}
        selectedSourceTypes={filters.filters.sourceTypes}
        selectedBiases={filters.filters.biases}
        minCredScore={filters.filters.minCredScore}
        dateRange={filters.filters.dateRange}
        onToggleSourceType={filters.toggleSourceType}
        onToggleBias={filters.toggleBias}
        onMinCredScoreChange={filters.setMinCredScore}
        onDateRangeChange={filters.setDateRange}
        onReset={filters.reset}
      />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <SearchBar
            value={query}
            onChange={setQuery}
            onDebouncedChange={debouncedUpdate}
            onSubmit={handleSubmit}
            placeholder="Search credible intelligence..."
            isLoading={isPending || isFetching}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
            <p>
              {results.length} result{results.length === 1 ? '' : 's'}
              {query ? ` for “${query}”` : ''}
            </p>
            <SortSelect value={filters.filters.sort} onChange={filters.setSort} />
          </div>
        </div>

        {isError && (
          <div className="rounded-lg border border-rose-700 bg-rose-900/40 p-4 text-sm text-rose-200">
            {(error as Error).message ?? 'Unknown error fetching results'}
          </div>
        )}

        {(isPending || isFetching) && results.length === 0 && (
          <div className="space-y-4" aria-live="polite" aria-busy="true">
            {skeletonCards.map((card) => (
              <div key={card} className="h-48 animate-pulse rounded-2xl bg-slate-800/60" />
            ))}
          </div>
        )}

        {!isPending && !isFetching && results.length === 0 && !isError && query && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-300">
            <h2 className="text-lg font-semibold text-white">No results match the selected filters.</h2>
            <p className="mt-2 text-sm">Try widening the date range or lowering the minimum credibility score.</p>
          </div>
        )}

        <div className="space-y-6">
          {results.map((result) => (
            <ResultCard key={result.id} result={result} />
          ))}
        </div>
      </div>
    </section>
  );
}
