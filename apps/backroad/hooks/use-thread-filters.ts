'use client';

import { create } from 'zustand';

interface ThreadFiltersState {
  query: string;
  tag?: string;
  setQuery: (value: string) => void;
  setTag: (value?: string) => void;
  clear: () => void;
}

export const useThreadFiltersStore = create<ThreadFiltersState>((set) => ({
  query: '',
  tag: undefined,
  setQuery: (value) => set({ query: value }),
  setTag: (value) => set({ tag: value }),
  clear: () => set({ query: '', tag: undefined }),
}));
