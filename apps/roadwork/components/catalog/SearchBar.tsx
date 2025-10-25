'use client';

import { ChangeEvent } from 'react';

type Props = {
  query: string;
  onChange: (value: string) => void;
};

export function SearchBar({ query, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="catalog-search" className="text-sm font-semibold text-slate-700">
        Search lessons
      </label>
      <input
        id="catalog-search"
        type="search"
        value={query}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        className="w-full rounded border border-slate-300 px-3 py-2 text-base shadow-sm focus-visible:ring-2 focus-visible:ring-brand-500"
      />
    </div>
  );
}
