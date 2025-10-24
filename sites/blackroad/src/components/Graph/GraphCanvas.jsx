import EmbeddingPlot from "./EmbeddingPlot";
import PowerDiagramView from "./PowerDiagramView";
import PhaseFieldView from "./PhaseFieldView";

export default function GraphCanvas({ job }) {
  if (!job) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm opacity-60">
        Run a spectral, layout, or phase job to see live visuals.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
      <section>
        <header className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Job Snapshot</h2>
          <span className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-wide">
            {job.status}
          </span>
        </header>
        <pre className="max-h-32 overflow-y-auto rounded bg-black/30 p-3 text-xs">{JSON.stringify(job.metrics ?? {}, null, 2)}</pre>
      </section>

      <EmbeddingPlot embedding={job.embedding} clusters={job.metrics?.clusters ?? job.clusters} />
      <PowerDiagramView state={job} />
      <PhaseFieldView state={job} />
    </div>
  );
}
