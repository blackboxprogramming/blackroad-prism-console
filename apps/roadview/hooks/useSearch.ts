'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiltersState } from './useFilters';
import { searchResponseSchema, SearchResult } from '../lib/schema';
import { track } from '../lib/telemetry';

const LAST_QUERY_KEY = 'roadview.lastQuery';

function applyFilters(results: SearchResult[], filters: FiltersState): SearchResult[] {
  return results
    .filter((result) => {
      if (filters.sourceTypes.size && !filters.sourceTypes.has(result.sourceType)) {
        return false;
      }
      if (filters.biases.size && !filters.biases.has(result.bias)) {
        return false;
      }
      if (typeof filters.minCredScore === 'number' && result.credScore < filters.minCredScore) {
        return false;
      }
      if (filters.dateRange.from) {
        if (new Date(result.publishedAt) < new Date(filters.dateRange.from)) {
          return false;
        }
      }
      if (filters.dateRange.to) {
        if (new Date(result.publishedAt) > new Date(filters.dateRange.to)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      switch (filters.sort) {
        case 'credibility':
          return b.credScore - a.credScore;
        case 'domain':
          return a.domain.localeCompare(b.domain);
        case 'recency':
        default:
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }
    });
}

export function useSearch(query: string, filters: FiltersState) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!debouncedQuery) return;
    window.localStorage.setItem(LAST_QUERY_KEY, debouncedQuery);
  }, [debouncedQuery]);

  const queryResult = useQuery({
    queryKey: ['search', debouncedQuery],
    enabled: debouncedQuery.length > 0,
    queryFn: async () => {
      const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }
      const json = await response.json();
      const parsed = searchResponseSchema.parse(json);
      const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
      track('search', {
        q: debouncedQuery,
        count: parsed.results.length,
        durationMs: Math.round(end - start)
      });
      return parsed;
    },
    staleTime: 60_000
  });

  const filteredResults = useMemo(() => {
    if (!queryResult.data) return [] as SearchResult[];
    return applyFilters(queryResult.data.results, filters);
  }, [queryResult.data, filters]);

  return {
    ...queryResult,
    debouncedQuery,
    results: filteredResults,
    facets: queryResult.data?.facets
  };
}

export function loadLastQuery(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(LAST_QUERY_KEY) ?? '';
}
