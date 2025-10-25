import { useCallback, useRef } from 'react';

const STORAGE_KEY = 'rw-events';
const MAX_EVENTS = 50;

export type TelemetryEvent = {
  type: 'lesson_view' | 'practice_start' | 'quiz_start' | 'quiz_submit' | 'import_export';
  payload?: Record<string, unknown>;
  timestamp: number;
};

function readEvents(): TelemetryEvent[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(-MAX_EVENTS);
    }
  } catch (error) {
    console.warn('telemetry read failed', error);
  }
  return [];
}

function writeEvents(events: TelemetryEvent[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
}

export function useTelemetry() {
  const buffer = useRef<TelemetryEvent[]>([]);

  const flush = useCallback(() => {
    if (buffer.current.length === 0) return;
    const existing = readEvents();
    const combined = [...existing, ...buffer.current];
    writeEvents(combined);
    if (process.env.NODE_ENV !== 'production') {
      console.info('[telemetry]', buffer.current);
    }
    buffer.current = [];
  }, []);

  const track = useCallback(
    (event: Omit<TelemetryEvent, 'timestamp'> & Partial<Pick<TelemetryEvent, 'timestamp'>>) => {
      const entry: TelemetryEvent = {
        timestamp: event.timestamp ?? Date.now(),
        type: event.type,
        payload: event.payload
      };
      buffer.current.push(entry);
      if (buffer.current.length >= 5) {
        flush();
      }
    },
    [flush]
  );

  return { track, flush };
}
