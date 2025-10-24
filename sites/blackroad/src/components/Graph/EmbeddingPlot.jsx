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
  );
}
