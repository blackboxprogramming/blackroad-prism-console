'use client';

import { ChangeEvent } from 'react';

type SortKey = 'title' | 'estMinutes';

type Props = {
  value: SortKey;
  onChange: (value: SortKey) => void;
};

export function SortSelect({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="catalog-sort" className="text-sm font-semibold text-slate-700">
        Sort by
      </label>
      <select
        id="catalog-sort"
        value={value}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          onChange(event.target.value as SortKey)
        }
        className="w-48 rounded border border-slate-300 px-3 py-2 text-base shadow-sm focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <option value="title">Title</option>
        <option value="estMinutes">Estimated time</option>
      </select>
    </div>
  );
}
