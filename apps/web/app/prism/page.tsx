import Tile from '@/components/Tile';

async function fetchSeries(path: string) {
import { Suspense } from 'react';

type SeriesPoint = { t: string; v: number };

type Timeseries = SeriesPoint[];

async function fetchSeries(path: string): Promise<Timeseries> {
  const base = process.env.NEXT_PUBLIC_API || 'https://api.blackroad.io';
  const res = await fetch(`${base}${path}`, {
    cache: 'no-store',
    headers: { 'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '' },
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function PrismDashboard() {
  // “from=-P7D” is ISO-8601 relative (handle this in your API or swap to explicit dates)
  const [events, errors, ghOpened, ghClosed, ghBugs] = await Promise.all([
    fetchSeries('/v1/metrics/events?from=-P7D'),
    fetchSeries('/v1/metrics/errors?from=-P7D'),
    fetchSeries('/v1/metrics/github/issues_opened?from=-P7D'),
    fetchSeries('/v1/metrics/github/issues_closed?from=-P7D'),
    fetchSeries('/v1/metrics/github/open_bugs'),
  const [events, errors, linCreated, linCompleted, linBurndown] = await Promise.all([
    fetchSeries('/v1/metrics/events?from=-P7D'),
    fetchSeries('/v1/metrics/errors?from=-P7D'),
    fetchSeries('/v1/metrics/linear/issues_created?from=-P7D'),
    fetchSeries('/v1/metrics/linear/issues_completed?from=-P7D'),
    fetchSeries(`/v1/metrics/linear/burndown?team=ENG&cycleStart=${encodeURIComponent('2025-10-01')}&cycleEnd=${encodeURIComponent('2025-10-14')}`),
  ]);

  return (
    <main style={{ padding: 24, display: 'grid', gap: 16 }}>
      <h1>PRISM</h1>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        <Tile title="Events (7d)" series={events} />
        <Tile title="Errors (7d)" series={errors} />
        <Tile title="GH Issues Opened (7d)" series={ghOpened} />
        <Tile title="GH Issues Closed (7d)" series={ghClosed} />
        <Tile title="Open Bugs (now)" series={ghBugs} />
        <Tile title="Linear Created (7d)" series={linCreated} />
        <Tile title="Linear Completed (7d)" series={linCompleted} />
        <Tile title="Linear Burndown (cycle)" series={linBurndown} />
      </div>

  if (!res.ok) {
    return [];
  }

  return res.json();
}

const Tile = ({ title, series }: { title: string; series: Timeseries }) => (
  <div
    style={{
      padding: 16,
      border: '1px solid #eee',
      borderRadius: 12,
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}
  >
    <h3 style={{ margin: 0 }}>{title}</h3>
    <div
      style={{
        height: 120,
        display: 'grid',
        placeItems: 'center',
        fontSize: 12,
        color: '#555',
        background: '#fafafa',
        borderRadius: 8,
      }}
    >
      <span>{series.reduce((a, p) => a + (p?.v ?? 0), 0)} total (7d)</span>
    </div>
  </div>
);

async function Tiles() {
  const [events, errors] = await Promise.all([
    fetchSeries('/v1/metrics/events?from=-P7D'),
    fetchSeries('/v1/metrics/errors?from=-P7D'),
  ]);

  return (
    <div
      style={{
        display: 'grid',
        gap: 16,
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      }}
    >
      <Tile title="Events (7d)" series={events} />
      <Tile title="Errors (7d)" series={errors} />
    </div>
  );
}

export default function PrismDashboardPage() {
  return (
    <main
      style={{
        padding: 24,
        display: 'grid',
        gap: 24,
        background: '#f6f7fb',
        minHeight: '100vh',
      }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0 }}>PRISM</h1>
        <p style={{ margin: 0, color: '#555' }}>
          Weekly health snapshot of events and errors across your connected sources.
        </p>
      </header>
      <Suspense fallback={<p>Loading…</p>}>
        {/* Render async data tiles */}
        <Tiles />
      </Suspense>
    </main>
  );
}
