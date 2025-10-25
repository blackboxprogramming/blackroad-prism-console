'use client';

import { useEffect, useMemo, useState } from 'react';
import { MetricSnapshot, MetricState, SystemStatusSnapshot, useMetricsStore } from './store';

const DEFAULT_PANEL =
  process.env.NEXT_PUBLIC_GRAFANA_PANEL_URL ||
  `${process.env.NEXT_PUBLIC_GRAFANA_URL || 'http://localhost:3001'}/d-solo/codex/ai-console?orgId=1&panelId=1&refresh=10s`;

const STATUS_REFRESH_INTERVAL = 30_000;
const TOKEN_REFRESH_INTERVAL = 55 * 60 * 1000;
const ACCESS_KEY = 'ai-console.token';
const REFRESH_KEY = 'ai-console.refresh';

export default function MetricsDashboardPage() {
  const { snapshot, setSnapshot } = useMetricsStore();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setAccessToken(window.localStorage.getItem(ACCESS_KEY));
    setRefreshToken(window.localStorage.getItem(REFRESH_KEY));
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    const controller = new AbortController();

    async function loadStatus() {
      try {
        const res = await fetch('/api/system/status', {
          method: 'GET',
          headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined,
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`status ${res.status}`);
        }

        const data = await res.json();
        if (cancelled) return;
        const mapped: SystemStatusSnapshot = {
          cpu: normalizeSnapshot(data.cpu),
          memory: normalizeSnapshot(data.memory),
          latency: normalizeSnapshot(data.latency),
          uptimeSeconds: data.uptime_seconds ?? data.uptimeSeconds ?? 0,
          generatedAt: data.generated_at ?? data.generatedAt ?? new Date().toISOString(),
        };
        setSnapshot(mapped);
        setError(null);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError('Unable to fetch system status.');
      }
    }

    loadStatus();
    const interval = window.setInterval(loadStatus, STATUS_REFRESH_INTERVAL);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(interval);
    };
  }, [accessToken, setSnapshot]);

  useEffect(() => {
    if (!refreshToken) return;

    const interval = window.setInterval(async () => {
      try {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) {
          throw new Error(`refresh ${res.status}`);
        }
        const body = await res.json();
        if (body?.accessToken) {
          window.localStorage.setItem(ACCESS_KEY, body.accessToken);
          setAccessToken(body.accessToken);
        }
        if (body?.refreshToken) {
          window.localStorage.setItem(REFRESH_KEY, body.refreshToken);
          setRefreshToken(body.refreshToken);
        }
      } catch (error) {
        // keep stale token but surface a banner on next fetch failure
        console.warn('jwt refresh failed', error);
      }
    }, TOKEN_REFRESH_INTERVAL);

    return () => window.clearInterval(interval);
  }, [refreshToken]);

  const uptime = useMemo(() => formatDuration(snapshot?.uptimeSeconds ?? 0), [snapshot?.uptimeSeconds]);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold">System Metrics</h1>
          <p className="text-sm text-gray-600">
            Unified observability across API, Next.js UI, and infrastructure. Tokens auto-refresh every 55 minutes.
          </p>
        </header>

        {error ? (
          <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}
        {!accessToken ? (
          <div className="rounded border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            Provide an access token under <code>{ACCESS_KEY}</code> in localStorage to load protected metrics.
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="CPU Utilization" metric={snapshot?.cpu} suffix="%" />
          <MetricCard label="Memory Utilization" metric={snapshot?.memory} suffix="%" />
          <MetricCard label="Avg Latency" metric={snapshot?.latency} suffix="ms" />
          <div className="rounded border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-500">Uptime</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{uptime}</div>
            <p className="mt-2 text-xs text-gray-500">
              Last updated {snapshot?.generatedAt ? new Date(snapshot.generatedAt).toLocaleString() : '—'}
            </p>
          </div>
        </section>

        <section className="rounded border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Grafana Overview</h2>
            <span className="text-xs text-gray-500">auto-refreshing embed</span>
          </div>
          <div className="mt-3 overflow-hidden rounded border border-gray-100">
            <iframe
              title="Grafana metrics"
              src={DEFAULT_PANEL}
              className="h-[380px] w-full border-0"
              loading="lazy"
              allow="fullscreen"
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, metric, suffix }: { label: string; metric: MetricSnapshot | undefined | null; suffix: string }) {
  const state = metric?.state ?? 'down';
  const displayValue = metric ? metric.value.toFixed(1) : '—';
  return (
    <div className="rounded border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-500">
        <span>{label}</span>
        <StateBadge state={state} />
      </div>
      <div className="mt-2 text-3xl font-semibold text-gray-900">
        {displayValue}
        <span className="ml-1 text-sm text-gray-500">{suffix}</span>
      </div>
    </div>
  );
}

function StateBadge({ state }: { state: MetricState }) {
  const emoji = state === 'ok' ? '🟢' : state === 'degraded' ? '🟠' : '🔴';
  const label = state === 'ok' ? 'OK' : state === 'degraded' ? 'Degraded' : 'Down';
  const color = state === 'ok' ? 'text-green-600' : state === 'degraded' ? 'text-orange-500' : 'text-red-600';
  return <span className={`font-medium ${color}`}>{emoji} {label}</span>;
}

function normalizeSnapshot(snapshot: any): MetricSnapshot {
  if (!snapshot || typeof snapshot.value !== 'number' || typeof snapshot.state !== 'string') {
    return { value: 0, state: 'down' };
  }
  return { value: Number(snapshot.value), state: snapshot.state as MetricState };
}

function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || Number.isNaN(totalSeconds)) {
    return '—';
  }
  const seconds = Math.floor(totalSeconds);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
