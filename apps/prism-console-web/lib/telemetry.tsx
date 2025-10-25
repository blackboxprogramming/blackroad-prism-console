'use client';

import { createContext, ReactNode, useContext, useMemo, useRef } from 'react';

type TelemetryEvent =
  | { type: 'screen:view'; screen: string }
  | { type: 'shortcut:click'; id: string }
  | { type: 'error'; message: string };

type TelemetryContextValue = {
  track: (event: TelemetryEvent) => void;
};

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const buffer = useRef<TelemetryEvent[]>([]);
  const value = useMemo<TelemetryContextValue>(
    () => ({
      track: (event) => {
        buffer.current.push(event);
        if (buffer.current.length >= 10) {
          flush();
        }
      }
    }),
    []
  );

  function flush() {
    // Placeholder for analytics ingestion.
    buffer.current = [];
  }

  return <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>;
}

export function useTelemetry() {
  const ctx = useContext(TelemetryContext);
  if (!ctx) {
    throw new Error('useTelemetry must be used within TelemetryProvider');
  }
  return ctx;
}
