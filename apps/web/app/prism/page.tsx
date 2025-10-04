import Tile from '@/components/Tile';
import { getFlags, isOn } from '@/lib/flags';

type SeriesPoint = { t: string; v: number };

async function fetchSeries(path: string): Promise<SeriesPoint[]> {
  const base = process.env.NEXT_PUBLIC_API || 'https://api.blackroad.io';
  const res = await fetch(`${base}${path}`, {
    cache: 'no-store',
    headers: { 'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '' },
  });
  if (!res.ok) return [];
  return (await res.json()) as SeriesPoint[];
}

function buildDemoSeries(): SeriesPoint[] {
  const now = Date.now();
  return Array.from({ length: 7 }, (_, idx) => ({
    t: new Date(now - (6 - idx) * 24 * 60 * 60 * 1000).toISOString(),
    v: 20 + idx * 3,
  }));
}

export default async function PrismDashboard() {
  const flags = getFlags();

  const [githubOpened, linearCycleTime, stripeArr] = await Promise.all([
    isOn('prism.github.tiles')
      ? fetchSeries('/v1/github/issues/opened?from=-P7D')
      : Promise.resolve<SeriesPoint[]>([]),
    isOn('prism.linear.tiles')
      ? fetchSeries('/v1/linear/cycle-time?from=-P7D')
      : Promise.resolve<SeriesPoint[]>([]),
    isOn('prism.stripe.tiles')
      ? fetchSeries('/v1/stripe/arr?from=-P30D')
      : Promise.resolve<SeriesPoint[]>([]),
  ]);

  const hasTiles =
    isOn('prism.github.tiles') ||
    isOn('prism.linear.tiles') ||
    isOn('prism.stripe.tiles') ||
    flags.demo_mode;

  return (
    <main style={{ padding: 24, display: 'grid', gap: 16 }}>
      <h1>PRISM</h1>
      {hasTiles ? (
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          }}
        >
          {isOn('prism.github.tiles') && (
            <Tile title="GH Issues Opened (7d)" series={githubOpened} />
          )}
          {isOn('prism.linear.tiles') && (
            <Tile
              title="Linear Cycle Time (7d)"
              series={linearCycleTime}
            />
          )}
          {isOn('prism.stripe.tiles') && (
            <Tile
              title="Stripe ARR (30d)"
              series={stripeArr}
              rangeLabel="30d"
            />
          )}
          {flags.demo_mode && (
            <Tile
              title="Demo: Sample Series"
              series={buildDemoSeries()}
            />
          )}
        </div>
      ) : (
        <p style={{ color: '#666' }}>
          No PRISM tiles are currently enabled. Toggle a feature flag in{' '}
          <code>config/flags.json</code> to bring a tile online.
        </p>
      )}
    </main>
  );
}
