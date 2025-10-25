'use client';

import { useCallback, useEffect, useRef } from 'react';

interface TelemetryEvent {
  name: string;
  payload?: Record<string, unknown>;
  timestamp: string;
}

const STORAGE_KEY = 'events-backroad';
const FLUSH_INTERVAL = 10_000;

export function useTelemetry() {
  const queueRef = useRef<TelemetryEvent[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const flush = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!queueRef.current.length) return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const events = stored ? (JSON.parse(stored) as TelemetryEvent[]) : [];
    const updated = [...events, ...queueRef.current];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // eslint-disable-next-line no-console
    console.info('[telemetry] Flushed events', queueRef.current);
    queueRef.current = [];
  }, []);

  const track = useCallback(
    (name: string, payload?: Record<string, unknown>) => {
      queueRef.current.push({ name, payload, timestamp: new Date().toISOString() });
      if (queueRef.current.length >= 10) {
        flush();
      }
    },
    [flush],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    timerRef.current = setInterval(flush, FLUSH_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      flush();
    };
  }, [flush]);

  return { track };
}
