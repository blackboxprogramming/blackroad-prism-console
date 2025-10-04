'use client';
import Sparkline from './Sparkline';

type Pt = { t: string; v: number };
export default function Tile({
  title,
  series,
  rangeLabel = '7d',
}: {
  title: string;
  series: Pt[];
  rangeLabel?: string;
}) {
  const totalRaw = (series ?? []).reduce((a, p) => a + (p?.v ?? 0), 0);
  const formatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  });
  const total = Number.isFinite(totalRaw) ? formatter.format(totalRaw) : '0';
  return (
    <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <span style={{ fontSize: 12, color: '#666' }}>{total} in {rangeLabel}</span>
      </div>
      <Sparkline data={series} height={140} />
    </div>
  );
}
