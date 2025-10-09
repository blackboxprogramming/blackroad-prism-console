'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

type FlagsResponse = {
  features: {
    prismGithub: boolean;
    prismLinear: boolean;
    prismStripe: boolean;
  };
  version: number;
  error?: string;
};

type GithubPoint = { label: string; value: number };
type LinearColumn = { label: string; value: number };
type StripeSummary = { mrr: number; arr: number; churnRate: number };

type GithubPayload = { series: GithubPoint[]; version: number };
type LinearPayload = { columns: LinearColumn[]; version: number };
type StripePayload = { summary: StripeSummary; version: number };

type LoadingState<T> = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  data: T | null;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    throw new Error(`Request failed with ${res.status}`);
  }
  return res.json();
}

export default function TilesDashboard() {
  const [flags, setFlags] = useState<FlagsResponse | null>(null);
  const [github, setGithub] = useState<LoadingState<GithubPayload>>({
    status: 'idle',
    data: null,
  });
  const [linear, setLinear] = useState<LoadingState<LinearPayload>>({
    status: 'idle',
    data: null,
  });
  const [stripe, setStripe] = useState<LoadingState<StripePayload>>({
    status: 'idle',
    data: null,
  });

  useEffect(() => {
    let mounted = true;
    fetch('/api/flags', { cache: 'no-store', credentials: 'include' })
      .then((res) => res.json())
      .then((data: FlagsResponse) => {
        if (!mounted) return;
        setFlags(data);
      })
      .catch(() => {
        if (!mounted) return;
        setFlags({
          features: {
            prismGithub: false,
            prismLinear: false,
            prismStripe: false,
          },
          version: 0,
          error: 'unavailable',
        });
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!flags) return;
    if (flags.features.prismGithub) {
      setGithub({ status: 'loading', data: null });
      fetchJson<GithubPayload>('/api/prism/github/issues_opened')
        .then((data) => setGithub({ status: 'ready', data }))
        .catch(() => setGithub({ status: 'error', data: null }));
    }
    if (flags.features.prismLinear) {
      setLinear({ status: 'loading', data: null });
      fetchJson<LinearPayload>('/api/prism/linear/board')
        .then((data) => setLinear({ status: 'ready', data }))
        .catch(() => setLinear({ status: 'error', data: null }));
    }
    if (flags.features.prismStripe) {
      setStripe({ status: 'loading', data: null });
      fetchJson<StripePayload>('/api/prism/stripe/summary')
        .then((data) => setStripe({ status: 'ready', data }))
        .catch(() => setStripe({ status: 'error', data: null }));
    }
  }, [
    flags?.features.prismGithub,
    flags?.features.prismLinear,
    flags?.features.prismStripe,
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Flag snapshot</h2>
        {flags ? (
          <div className="mt-2 text-sm text-gray-700">
            <p>
              Version {flags.version}{' '}
              {flags.error ? (
                <span className="text-red-600">({flags.error})</span>
              ) : null}
            </p>
            <ul className="mt-2 space-y-1 font-mono text-xs">
              <li>
                prism.github.tiles ·{' '}
                {flags.features.prismGithub ? 'enabled' : 'disabled'}
              </li>
              <li>
                prism.linear.tiles ·{' '}
                {flags.features.prismLinear ? 'enabled' : 'disabled'}
              </li>
              <li>
                prism.stripe.tiles ·{' '}
                {flags.features.prismStripe ? 'enabled' : 'disabled'}
              </li>
            </ul>
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-500">Loading flags…</p>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <TileCard
          title="GitHub Issues (7d)"
          enabled={Boolean(flags?.features.prismGithub)}
        >
          {renderGithub(github)}
        </TileCard>
        <TileCard
          title="Linear Board"
          enabled={Boolean(flags?.features.prismLinear)}
        >
          {renderLinear(linear)}
        </TileCard>
        <TileCard
          title="Stripe Summary"
          enabled={Boolean(flags?.features.prismStripe)}
        >
          {renderStripe(stripe)}
        </TileCard>
      </div>
    </div>
  );
}

type TileCardProps = {
  title: string;
  enabled: boolean;
  children: ReactNode;
};

function TileCard({ title, enabled, children }: TileCardProps) {
  return (
    <div
      className={`rounded border p-4 shadow-sm transition-opacity ${
        enabled
          ? 'border-gray-200 bg-white opacity-100'
          : 'border-dashed border-gray-300 bg-gray-50 opacity-60'
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{title}</h3>
        <span
          className={`text-xs font-medium ${enabled ? 'text-green-600' : 'text-gray-500'}`}
        >
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>
      <div className="mt-3 text-sm text-gray-700">{children}</div>
    </div>
  );
}

function renderGithub(state: LoadingState<GithubPayload>) {
  if (state.status === 'idle') return <p>Selecting flag…</p>;
  if (state.status === 'loading') return <p>Loading issues…</p>;
  if (state.status === 'error' || !state.data)
    return <p className="text-red-600">Unable to load GitHub metrics.</p>;
  return (
    <ul className="space-y-1 font-mono text-xs">
      {state.data.series.map((point) => (
        <li key={point.label} className="flex items-center justify-between">
          <span>{point.label}</span>
          <span>{point.value}</span>
        </li>
      ))}
    </ul>
  );
}

function renderLinear(state: LoadingState<LinearPayload>) {
  if (state.status === 'idle') return <p>Selecting flag…</p>;
  if (state.status === 'loading') return <p>Loading board…</p>;
  if (state.status === 'error' || !state.data)
    return <p className="text-red-600">Unable to load Linear board.</p>;
  return (
    <ul className="space-y-1 font-mono text-xs">
      {state.data.columns.map((column) => (
        <li key={column.label} className="flex items-center justify-between">
          <span>{column.label}</span>
          <span>{column.value}</span>
        </li>
      ))}
    </ul>
  );
}

function renderStripe(state: LoadingState<StripePayload>) {
  if (state.status === 'idle') return <p>Selecting flag…</p>;
  if (state.status === 'loading') return <p>Loading summary…</p>;
  if (state.status === 'error' || !state.data)
    return <p className="text-red-600">Unable to load Stripe summary.</p>;
  const { mrr, arr, churnRate } = state.data.summary;
  return (
    <div className="space-y-1 font-mono text-xs">
      <p>MRR: ${(mrr / 1000).toFixed(1)}k</p>
      <p>ARR: ${(arr / 1_000_000).toFixed(2)}M</p>
      <p>Churn: {churnRate.toFixed(1)}%</p>
    </div>
  );
}
