'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'rw-a11y';

type Prefs = {
  reducedMotion: boolean;
  fontScale: number;
  highContrast: boolean;
};

const defaultPrefs: Prefs = {
  reducedMotion: false,
  fontScale: 1,
  highContrast: false
};

export function useA11yPrefs() {
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setPrefs({ ...defaultPrefs, ...JSON.parse(raw) });
      } catch (error) {
        console.warn('invalid a11y prefs', error);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    document.documentElement.style.setProperty('--rw-font-scale', prefs.fontScale.toString());
    document.body.dataset.highContrast = prefs.highContrast ? 'true' : 'false';
  }, [prefs]);

  return { prefs, setPrefs };
}
