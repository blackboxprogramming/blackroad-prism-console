import { useState } from 'react';

const BUTTONS = [
  { id: 'spectral', label: 'Run Spectral (k=8) 🧪' },
  { id: 'layout', label: 'Blue-Noise Layout 🧰' },
  { id: 'phase', label: 'Phase Relax 📈' }
];

export default function GraphControls({ onRun, onSelect }) {
  const [params, setParams] = useState({ k: 8, iterations: 50, steps: 100 });

  const trigger = (id) => {
    onRun?.({ id, params });
    onSelect?.(id);
    console.info(`graph-lab:${id}`, params);
  };

  return (
    <aside className="flex flex-col gap-6">
      <div className="rounded-xl border border-white/10 bg-slate-900 p-5 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Graph Lab Controls</h2>
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="text-slate-300">Spectral k</span>
            <input
              className="mt-1 w-full rounded bg-slate-800 px-3 py-2 text-white"
              type="number"
              value={params.k}
              onChange={(event) => setParams({ ...params, k: Number(event.target.value) })}
              min={2}
              max={32}
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-300">Layout iterations</span>
            <input
              className="mt-1 w-full rounded bg-slate-800 px-3 py-2 text-white"
              type="number"
              value={params.iterations}
              onChange={(event) => setParams({ ...params, iterations: Number(event.target.value) })}
              min={10}
              max={500}
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-300">Phase steps</span>
            <input
              className="mt-1 w-full rounded bg-slate-800 px-3 py-2 text-white"
              type="number"
              value={params.steps}
              onChange={(event) => setParams({ ...params, steps: Number(event.target.value) })}
              min={20}
              max={500}
            />
          </label>
        </div>
        <div className="mt-6 space-y-3">
          {BUTTONS.map((button) => (
            <button
              key={button.id}
              type="button"
              className="w-full rounded-lg bg-sky-500 px-4 py-2 font-semibold text-slate-900 transition hover:bg-sky-400"
              onClick={() => trigger(button.id)}
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-slate-900 p-4 text-sm text-slate-300">
        <p className="font-semibold mb-2">Emoji breadcrumbs</p>
        <ul className="space-y-1">
          <li>🎯 goal set</li>
          <li>🧭 choose params</li>
          <li>🧰 extract helper</li>
          <li>🧪 write test</li>
          <li>📈 add metric</li>
          <li>🔐 RBAC enforced</li>
        </ul>
      </div>
    </aside>
  );
}
