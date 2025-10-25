'use client';

import { useEffect } from 'react';
import { Search, XCircle } from 'lucide-react';
import clsx from 'clsx';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onDebouncedChange?: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
};

export function SearchBar({ value, onChange, onDebouncedChange, onSubmit, placeholder, isLoading }: SearchBarProps) {
  useEffect(() => {
    if (!onDebouncedChange) return;
    const handle = setTimeout(() => {
      onDebouncedChange(value);
    }, 350);
    return () => clearTimeout(handle);
  }, [value, onDebouncedChange]);

  return (
    <form
      className="relative flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 shadow-lg"
      aria-label="Search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value);
      }}
    >
      <Search aria-hidden className="h-5 w-5 text-slate-400" />
      <label htmlFor="search-input" className="sr-only">
        Search query
      </label>
      <input
        id="search-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onChange('');
            onDebouncedChange?.('');
          }
        }}
        placeholder={placeholder ?? 'Search RoadView'}
        className="w-full bg-transparent text-base text-slate-100 placeholder:text-slate-500 focus:outline-none"
        aria-label="Search query"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          className="text-slate-400 transition hover:text-slate-200"
          onClick={() => {
            onChange('');
            onDebouncedChange?.('');
          }}
        >
          <XCircle className="h-5 w-5" />
        </button>
      )}
      <button
        type="submit"
        className="ml-auto inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow transition hover:bg-brand-500 focus-visible:outline"
      >
        Search
      </button>
      <span
        aria-live="polite"
        className={clsx('absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400', {
          hidden: !isLoading
        })}
      >
        Loading…
      </span>
    </form>
  );
}
