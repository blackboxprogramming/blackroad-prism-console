import { useMemo } from 'react';

function fallbackPoints() {
  return [
    { x: 0.2, y: 0.4, cluster: 0 },
    { x: 0.7, y: 0.6, cluster: 1 },
    { x: 0.4, y: 0.8, cluster: 0 }
  ];
}

export default function EmbeddingPlot({ job }) {
  const points = useMemo(() => fallbackPoints(), [job?.id]);
  const colors = ['#67e8f9', '#fbbf24', '#a855f7', '#f97316'];
  return (
    <svg viewBox="0 0 1 1" className="h-64 w-full rounded-lg bg-slate-800">
      {points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={1 - point.y}
          r={0.025}
          fill={colors[point.cluster % colors.length]}
          opacity={0.85}
        />
      ))}
    </svg>
export default function EmbeddingPlot({ embedding, clusters }) {
  if (!embedding || embedding.length === 0) {
    return (
      <section className="rounded-xl border border-white/10 bg-black/30 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide opacity-70">Spectral Embedding</h3>
        <p className="mt-2 text-xs opacity-60">Run the spectral engine to populate embeddings.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-white/10 bg-black/30 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide opacity-70">Spectral Embedding</h3>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        {embedding.map((row, idx) => (
          <div key={idx} className="rounded bg-white/5 p-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">node {idx}</span>
              <span className="text-[10px] opacity-60">cluster {clusters?.[idx] ?? '?'}</span>
            </div>
            <div className="mt-1 font-mono">
              {row.map((value, j) => value.toFixed(3)).join(", ")}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
