'use client';

import { useCallback, useMemo, useState } from 'react';
import { track } from '../lib/telemetry';

export type SortOption = 'recency' | 'credibility' | 'domain';

export type FiltersState = {
  sourceTypes: Set<string>;
  biases: Set<string>;
  minCredScore: number | null;
  dateRange: { from?: string; to?: string };
  sort: SortOption;
};

const DEFAULT_FILTERS: FiltersState = {
  sourceTypes: new Set(),
  biases: new Set(),
  minCredScore: null,
  dateRange: {},
  sort: 'recency'
};

function cloneFilters(state: FiltersState): FiltersState {
  return {
    sourceTypes: new Set(state.sourceTypes),
    biases: new Set(state.biases),
    minCredScore: state.minCredScore,
    dateRange: { ...state.dateRange },
    sort: state.sort
  };
}

export function useFilters(initial?: Partial<FiltersState>) {
  const [filters, setFilters] = useState<FiltersState>({
    ...cloneFilters(DEFAULT_FILTERS),
    ...initial,
    sourceTypes: initial?.sourceTypes ?? new Set(),
    biases: initial?.biases ?? new Set()
  });

  const update = useCallback((updater: (prev: FiltersState) => FiltersState) => {
    setFilters((prev) => updater(cloneFilters(prev)));
  }, []);

  const actions = useMemo(
    () => ({
      toggleSourceType: (sourceType: string) =>
        update((prev) => {
          if (prev.sourceTypes.has(sourceType)) {
            prev.sourceTypes.delete(sourceType);
          } else {
            prev.sourceTypes.add(sourceType);
          }
          track('filter_change', { facet: 'sourceType', value: sourceType });
          return prev;
        }),
      toggleBias: (bias: string) =>
        update((prev) => {
          if (prev.biases.has(bias)) {
            prev.biases.delete(bias);
          } else {
            prev.biases.add(bias);
          }
          track('filter_change', { facet: 'bias', value: bias });
          return prev;
        }),
      setMinCredScore: (value: number | null) =>
        update((prev) => {
          prev.minCredScore = value;
          track('filter_change', { facet: 'minCredScore', value });
          return prev;
        }),
      setDateRange: (range: { from?: string; to?: string }) =>
        update((prev) => {
          prev.dateRange = range;
          track('filter_change', { facet: 'dateRange', value: range });
          return prev;
        }),
      setSort: (sort: SortOption) =>
        update((prev) => {
          prev.sort = sort;
          track('filter_change', { facet: 'sort', value: sort });
          return prev;
        }),
      reset: () => setFilters(cloneFilters(DEFAULT_FILTERS))
    }),
    [update]
  );

  return { filters, ...actions };
}
