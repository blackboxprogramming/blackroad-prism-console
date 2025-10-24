import EmbeddingPlot from './EmbeddingPlot';
import PowerDiagramView from './PowerDiagramView';
import PhaseFieldView from './PhaseFieldView';

const PANELS = {
  spectral: EmbeddingPlot,
  layout: PowerDiagramView,
  phase: PhaseFieldView
};

export default function GraphCanvas({ job, selection }) {
  const Component = PANELS[selection ?? 'spectral'];
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900 p-4 shadow-lg">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span role="img" aria-label="graph">
          📊
        </span>
        Graph Output
      </h2>
      <Component job={job} />
    </div>
  );
}
