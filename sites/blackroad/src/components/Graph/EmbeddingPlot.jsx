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
