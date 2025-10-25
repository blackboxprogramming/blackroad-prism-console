'use client';

import { create } from 'zustand';

export type MetricState = 'ok' | 'degraded' | 'down';

export type MetricSnapshot = {
  value: number;
  state: MetricState;
};

export type SystemStatusSnapshot = {
  cpu: MetricSnapshot;
  memory: MetricSnapshot;
  latency: MetricSnapshot;
  uptimeSeconds: number;
  generatedAt: string;
};

type MetricsStore = {
  snapshot: SystemStatusSnapshot | null;
  setSnapshot: (snapshot: SystemStatusSnapshot) => void;
};

export const useMetricsStore = create<MetricsStore>((set) => ({
  snapshot: null,
  setSnapshot: (snapshot) => set({ snapshot }),
}));
