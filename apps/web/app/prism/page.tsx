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
  const [events, errors, charges, activeSubs, mrr] = await Promise.all([
    fetchSeries('/v1/metrics/events?from=-P7D'),
    fetchSeries('/v1/metrics/errors?from=-P7D'),
    fetchSeries('/v1/metrics/stripe/charges?from=-P7D'),
    fetchSeries('/v1/metrics/stripe/active_subs'),
    fetchSeries('/v1/metrics/stripe/mrr'),
  ]);

  return (
    <main style={{ padding: 24, display: 'grid', gap: 16 }}>
      <h1>PRISM</h1>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        <Tile title="Events (7d)" series={events} />
        <Tile title="Errors (7d)" series={errors} />
        <Tile title="Stripe: New Charges (7d, $)" series={charges} rangeLabel="7d" />
        <Tile title="Stripe: Active Subs (now)" series={activeSubs} rangeLabel="now" />
        <Tile title="Stripe: MRR (now, $)" series={mrr} rangeLabel="now" />
      </div>
    </main>
  );
}
