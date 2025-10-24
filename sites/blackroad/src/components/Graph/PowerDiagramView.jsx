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
