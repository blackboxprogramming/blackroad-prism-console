'use client';

import { SortOption } from '../hooks/useFilters';

type SortSelectProps = {
  value: SortOption;
  onChange: (value: SortOption) => void;
};

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <label className="flex items-center gap-3 text-sm text-slate-200">
      <span className="font-medium">Sort by</span>
      <select
        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
        value={value}
        onChange={(event) => onChange(event.target.value as SortOption)}
      >
        <option value="recency">Recency</option>
        <option value="credibility">Credibility</option>
        <option value="domain">Domain A→Z</option>
      </select>
    </label>
  );
}
