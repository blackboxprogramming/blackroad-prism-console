'use client';

import { SearchFacets } from '../lib/schema';

export type FiltersPanelProps = {
  facets?: SearchFacets;
  selectedSourceTypes: Set<string>;
  selectedBiases: Set<string>;
  minCredScore: number | null;
  dateRange: { from?: string; to?: string };
  onToggleSourceType: (value: string) => void;
  onToggleBias: (value: string) => void;
  onMinCredScoreChange: (value: number | null) => void;
  onDateRangeChange: (range: { from?: string; to?: string }) => void;
  onReset: () => void;
};

export function FiltersPanel({
  facets,
  selectedSourceTypes,
  selectedBiases,
  minCredScore,
  dateRange,
  onToggleSourceType,
  onToggleBias,
  onMinCredScoreChange,
  onDateRangeChange,
  onReset
}: FiltersPanelProps) {
  const sourceTypes = Object.entries(facets?.sourceType ?? {});
  const biases = Object.entries(facets?.bias ?? {});

  return (
    <aside
      aria-label="Filters"
      className="flex flex-col gap-6 rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200 shadow-lg"
    >
      <header className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Filters</h2>
        <button
          type="button"
          onClick={() => onReset()}
          className="rounded-md border border-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:bg-slate-800"
        >
          Reset
        </button>
      </header>

      <fieldset className="space-y-3" aria-label="Source type filters">
        <legend className="text-xs font-semibold uppercase tracking-wide text-slate-400">Source type</legend>
        {sourceTypes.length === 0 && <p className="text-slate-400">No source metadata yet</p>}
        {sourceTypes.map(([type, count]) => {
          const id = `filter-source-${type}`;
          return (
            <label key={type} htmlFor={id} className="flex items-center justify-between gap-3 rounded-md bg-slate-900/50 px-3 py-2">
              <span className="capitalize">{type}</span>
              <span className="flex items-center gap-3">
                <input
                  id={id}
                  type="checkbox"
                  checked={selectedSourceTypes.has(type)}
                  onChange={() => onToggleSourceType(type)}
                />
                <span aria-hidden className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                  {count}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <fieldset className="space-y-3" aria-label="Bias filters">
        <legend className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bias</legend>
        {biases.length === 0 && <p className="text-slate-400">No bias data</p>}
        {biases.map(([bias, count]) => {
          const id = `filter-bias-${bias}`;
          return (
            <label key={bias} htmlFor={id} className="flex items-center justify-between gap-3 rounded-md bg-slate-900/50 px-3 py-2">
              <span className="capitalize">{bias}</span>
              <span className="flex items-center gap-3">
                <input id={id} type="checkbox" checked={selectedBiases.has(bias)} onChange={() => onToggleBias(bias)} />
                <span aria-hidden className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{count}</span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <fieldset className="space-y-3" aria-label="Minimum credibility score">
        <legend className="text-xs font-semibold uppercase tracking-wide text-slate-400">Minimum credibility</legend>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={minCredScore ?? 0}
            onChange={(event) => onMinCredScoreChange(Number(event.target.value))}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={minCredScore ?? 0}
            aria-label="Minimum credibility score"
            className="w-full"
          />
          <output className="w-12 text-right text-sm text-white" aria-live="polite">
            {minCredScore ?? 0}
          </output>
        </div>
        <button
          type="button"
          className="text-xs text-brand-300 underline"
          onClick={() => onMinCredScoreChange(null)}
        >
          Clear minimum
        </button>
      </fieldset>

      <fieldset className="space-y-3" aria-label="Date range">
        <legend className="text-xs font-semibold uppercase tracking-wide text-slate-400">Date range</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-slate-300">
            <span className="font-semibold text-slate-200">From</span>
            <input
              type="date"
              value={dateRange.from ?? ''}
              onChange={(event) => onDateRangeChange({ ...dateRange, from: event.target.value || undefined })}
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-300">
            <span className="font-semibold text-slate-200">To</span>
            <input
              type="date"
              value={dateRange.to ?? ''}
              onChange={(event) => onDateRangeChange({ ...dateRange, to: event.target.value || undefined })}
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            />
          </label>
        </div>
      </fieldset>
    </aside>
  );
}
