'use client';
import { LineChart, Line, Tooltip, ResponsiveContainer, YAxis, XAxis } from 'recharts';

type Pt = { t: string; v: number };
export default function Sparkline({ data, height = 120 }: { data: Pt[]; height?: number }) {
  const parsed = (data ?? []).map(d => ({ t: new Date(d.t), v: Number(d.v) || 0 }));
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={parsed}>
          <XAxis dataKey="t" tickFormatter={fmt} hide />
          <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
          <Tooltip
            formatter={(val: any) => [String(val), 'Count']}
            labelFormatter={(label: any) => fmt(label as Date)}
          />
          <Line type="monotone" dataKey="v" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
