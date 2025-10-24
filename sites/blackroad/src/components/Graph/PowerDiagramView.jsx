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
function heat(value) {
  const clamped = Math.max(0, Math.min(1, value));
  const hue = (1 - clamped) * 220;
  return `hsl(${hue}deg 80% 50%)`;
}

export default function PowerDiagramView({ state }) {
  const history = state?.metrics?.movementHistory;
  if (!history) {
    return (
      <section className="rounded-xl border border-white/10 bg-black/30 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide opacity-70">Power-Lloyd Layout</h3>
        <p className="mt-2 text-xs opacity-60">Run the layout engine to inspect centroid movement.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-white/10 bg-black/30 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide opacity-70">Power-Lloyd Layout</h3>
      <div className="mt-3 flex gap-3 text-xs">
        <div className="flex-1">
          <div className="font-semibold">Movement</div>
          <ul className="mt-1 space-y-1 font-mono">
            {history.map((value, idx) => (
              <li key={idx} className="flex items-center justify-between">
                <span>iter {idx}</span>
                <span>{value.toFixed ? value.toFixed(4) : value}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-1">
          <div className="font-semibold">Mass error</div>
          <ul className="mt-1 space-y-1 font-mono">
            {state.metrics.massErrorHistory?.map((value, idx) => (
              <li key={idx} className="flex items-center justify-between">
                <span>iter {idx}</span>
                <span>{value.toFixed ? value.toFixed(4) : value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {state.density?.values && (
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase opacity-60">Density preview</div>
          <div className="mt-2 grid" style={{ gridTemplateColumns: `repeat(${state.density.width}, minmax(0, 1fr))`, gap: 2 }}>
            {state.density.values.map((value, idx) => (
              <div key={idx} className="h-6 rounded" style={{ background: heat(value) }} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
