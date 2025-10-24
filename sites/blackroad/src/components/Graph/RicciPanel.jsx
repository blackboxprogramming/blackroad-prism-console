import CurvatureLegend from './CurvatureLegend';

function formatNumber(value) {
  return Number(value).toFixed(3);
}

export default function RicciPanel({ job }) {
  const params = job?.params ?? {};
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/10 bg-slate-900 p-4">
        <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
          <span role="img" aria-label="ricci">
            ♾️
          </span>
          Ricci flow sandbox
        </h3>
        <p className="text-sm text-slate-300">
          Smooth the metric by nudging edge weights toward the target curvature. Adjust τ and switch between Forman (fast) or
          Ollivier (transport-aware) curvature to explore how the graph breathes.
        </p>
      </div>
      <CurvatureLegend />
      <div className="rounded-lg border border-white/10 bg-slate-900 p-4 text-sm text-slate-300">
        <h4 className="font-semibold mb-3">Current recipe</h4>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <dt className="uppercase text-[11px] tracking-wide text-slate-500">Curvature</dt>
            <dd className="font-medium">{params.curvature ?? 'forman'}</dd>
          </div>
          <div>
            <dt className="uppercase text-[11px] tracking-wide text-slate-500">τ step</dt>
            <dd className="font-medium">{formatNumber(params.tau ?? 0.05)}</dd>
          </div>
          <div>
            <dt className="uppercase text-[11px] tracking-wide text-slate-500">Spectral k</dt>
            <dd className="font-medium">{params.k ?? 8}</dd>
          </div>
          <div>
            <dt className="uppercase text-[11px] tracking-wide text-slate-500">Iterations</dt>
            <dd className="font-medium">{params.iterations ?? 20}</dd>
          </div>
        </dl>
        <p className="mt-3 text-[11px] text-slate-400">
          Use the Ricci tab to replay individual steps (`/step`) or anneal τ in chat. The layout updates after each flow step so you
          can watch bottlenecks relax.
        </p>
      </div>
    </div>
  );
}
