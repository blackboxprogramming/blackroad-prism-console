'use client';

import { useMemo } from 'react';

const QUEUE_KEY = 'backroad:queue-timestamps';
const DRAFT_KEY = 'backroad:draft-counts';
const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;
const MAX_DRAFTS_PER_HOUR = 5;

export function useRateLimiter() {
  return useMemo(() => ({
    canQueuePost(): boolean {
      if (typeof window === 'undefined') return true;
      const timestamps = getTimestamps(QUEUE_KEY);
      const now = Date.now();
      const recent = timestamps.filter((timestamp) => now - timestamp < ONE_MINUTE);
      return recent.length < 1;
    },
    trackQueuedPost(): void {
      if (typeof window === 'undefined') return;
      persistTimestamp(QUEUE_KEY);
      incrementDraftCount();
    },
    canDraft(): boolean {
      if (typeof window === 'undefined') return true;
      const counts = getCounts();
      const now = Date.now();
      const withinHour = counts.filter((entry) => now - entry.timestamp < ONE_HOUR);
      const totalDrafts = withinHour.reduce((sum, entry) => sum + entry.count, 0);
      return totalDrafts < MAX_DRAFTS_PER_HOUR;
    },
  }), []);
}

interface DraftEntry {
  timestamp: number;
  count: number;
}

function getTimestamps(key: string): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as number[]) : [];
  } catch (error) {
    console.error('Failed to read rate limiter data', error);
    return [];
  }
}

function persistTimestamp(key: string) {
  if (typeof window === 'undefined') return;
  const timestamps = getTimestamps(key);
  timestamps.push(Date.now());
  window.localStorage.setItem(key, JSON.stringify(timestamps));
}

function getCounts(): DraftEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(DRAFT_KEY);
    return stored ? (JSON.parse(stored) as DraftEntry[]) : [];
  } catch (error) {
    console.error('Failed to read draft counts', error);
    return [];
  }
}

function incrementDraftCount() {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  const counts = getCounts().filter((entry) => now - entry.timestamp < ONE_HOUR);
  counts.push({ timestamp: now, count: 1 });
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(counts));
}
