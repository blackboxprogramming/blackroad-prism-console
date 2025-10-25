'use client';

import { useEffect, useState } from 'react';

const THEME_KEY = 'rw-theme';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(THEME_KEY) as 'light' | 'dark' | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.dataset.theme = stored;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(THEME_KEY, theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
      className="rounded border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-900 shadow focus-visible:ring-2 focus-visible:ring-brand-500"
      aria-pressed={theme === 'dark'}
    >
      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
    </button>
  );
}
