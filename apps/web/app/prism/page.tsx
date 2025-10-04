import Tile from '@/components/Tile';

async function fetchSeries(path: string) {
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
        <Tile title="Linear Created (7d)" series={linCreated} />
        <Tile title="Linear Completed (7d)" series={linCompleted} />
        <Tile title="Linear Burndown (cycle)" series={linBurndown} />
      </div>
    </main>
  );
}
