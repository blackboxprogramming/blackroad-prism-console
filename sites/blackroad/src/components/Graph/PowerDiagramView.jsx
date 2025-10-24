import { useMemo } from 'react';

const COLORS = ['#38bdf8', '#f472b6', '#34d399', '#f97316'];

function fallbackCells() {
  return Array.from({ length: 12 }, (_, idx) => ({ angle: (2 * Math.PI * idx) / 12, radius: 0.35, owner: idx % COLORS.length }));
}

export default function PowerDiagramView({ job }) {
  const cells = useMemo(() => fallbackCells(), [job?.id]);
  return (
    <svg viewBox="-1 -1 2 2" className="h-64 w-full rounded-lg bg-slate-800">
      {cells.map((cell, idx) => (
        <circle key={idx} cx={Math.cos(cell.angle) * cell.radius} cy={Math.sin(cell.angle) * cell.radius} r={0.08} fill={COLORS[cell.owner]} opacity={0.8} />
      ))}
    </svg>
  );
}
