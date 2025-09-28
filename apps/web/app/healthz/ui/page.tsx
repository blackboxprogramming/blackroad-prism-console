import Tile from '@/components/Tile';

async function fetchSeries(path: string) {
  const base = process.env.NEXT_PUBLIC_API || 'https://api.blackroad.io';
  const res = await fetch(`${base}${path}`, {
    cache: 'no-store',
    headers: { 'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '' },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  return res.json();
}

export default async function UIHealth() {
  let events: any[] = [];
  let errors: any[] = [];
  let ok = true;
  let msg = 'OK';

  try {
    [events, errors] = await Promise.all([
      fetchSeries('/v1/metrics/events?from=-P2D'),
      fetchSeries('/v1/metrics/errors?from=-P2D'),
    ]);
  } catch (e: any) {
    ok = false;
    msg = e?.message || 'Fetch error';
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>UI Smoke</h1>
      <p>
        Status:{' '}
        <span
          style={{
            padding: '2px 8px',
            borderRadius: 8,
            color: ok ? '#0f5132' : '#842029',
            background: ok ? '#d1e7dd' : '#f8d7da',
            border: '1px solid',
            borderColor: ok ? '#badbcc' : '#f5c2c7',
          }}
        >
          {ok ? 'PASS' : `FAIL – ${msg}`}
        </span>
      </p>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        <Tile title="Events (2d)" series={events} rangeLabel="2d" />
        <Tile title="Errors (2d)" series={errors} rangeLabel="2d" />
      </div>
      <p style={{ fontSize: 12, color: '#666', marginTop: 16 }}>
        This page checks API reachability, auth header, JSON shape, and rendering. Good for quick sanity before demos.
      </p>
    </main>
  );
}
