import { Suspense } from 'react';

type SeriesPoint = { t: string; v: number };

type Timeseries = SeriesPoint[];

async function fetchSeries(path: string): Promise<Timeseries> {
  const base = process.env.NEXT_PUBLIC_API || 'https://api.blackroad.io';
  const res = await fetch(`${base}${path}`, {
    cache: 'no-store',
    headers: { 'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '' },
  });

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
