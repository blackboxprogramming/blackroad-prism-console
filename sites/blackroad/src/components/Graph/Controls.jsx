import { useState } from 'react';

const BUTTONS = [
  { id: 'spectral', label: 'Run Spectral (k=8) 🧪' },
  { id: 'layout', label: 'Blue-Noise Layout 🧰' },
  { id: 'phase', label: 'Phase Relax 📈' },
  { id: 'ricci', label: 'Ricci Flow ♾️' }
];

export default function GraphControls({ onRun, onSelect }) {
  const [params, setParams] = useState({ k: 8, iterations: 50, steps: 100, tau: 0.05, curvature: 'forman' });

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
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-slate-300">Ricci τ</span>
              <input
                className="mt-1 w-full rounded bg-slate-800 px-3 py-2 text-white"
                type="number"
                step="0.01"
                value={params.tau}
                onChange={(event) => setParams({ ...params, tau: Number(event.target.value) })}
                min={0.001}
                max={0.5}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-300">Curvature</span>
              <select
                className="mt-1 w-full rounded bg-slate-800 px-3 py-2 text-white"
                value={params.curvature}
                onChange={(event) => setParams({ ...params, curvature: event.target.value })}
              >
                <option value="forman">Forman</option>
                <option value="ollivier">Ollivier</option>
              </select>
            </label>
          </div>
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
import { useState } from "react";

const DEFAULT_EDGE_LIST = `0 1\n1 2\n2 3\n3 0\n0 2`;
const DEFAULT_DENSITY = `0.1 0.3 0.4\n0.6 0.9 0.2\n0.2 0.3 0.8`;
const DEFAULT_FIELD = `-0.5 0.2 -0.1\n0.1 0.6 -0.3\n-0.4 0.3 0.2`;

async function tryGraphQL(query, variables) {
  try {
    const res = await fetch("/api/graph", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0]?.message ?? "GraphQL error");
    return json.data;
  } catch (error) {
    console.warn("graph gateway offline, using local preview", error);
    return null;
  }
}

const sampleSpectral = {
  id: "spectral-local",
  status: "completed",
  metrics: {
    eigengap: [0.0, 0.412, 0.982],
    conductance: [0.12, 0.28],
    modularity: 0.44
  },
  embedding: [
    [0.12, -0.34],
    [0.18, -0.22],
    [-0.19, 0.27],
    [-0.11, 0.29]
  ],
  clusters: [0, 0, 1, 1],
  artifacts: [
    { id: "local-csv", type: "csv", path: "spectral_embedding.csv", description: "demo embedding", sha256: "local" }
  ]
};

const sampleLayout = {
  id: "power-local",
  status: "completed",
  metrics: {
    movementHistory: [0.8, 0.4, 0.12],
    massErrorHistory: [0.5, 0.18, 0.05]
  },
  density: {
    width: 3,
    height: 3,
    values: [0.2, 0.3, 0.4, 0.5, 0.8, 0.3, 0.1, 0.2, 0.7]
  },
  artifacts: [
    { id: "local-layout", type: "png", path: "power_cells.png", description: "demo cells", sha256: "local" }
  ]
};

const samplePhase = {
  id: "phase-local",
  status: "completed",
  metrics: {
    residuals: Array.from({ length: 10 }, (_, i) => Number((0.02 / (i + 1)).toFixed(6)))
  },
  frames: [
    {
      width: 3,
      height: 3,
      values: [0.2, 0.4, 0.6, 0.5, 0.1, 0.2, 0.8, 0.7, 0.3]
    }
  ],
  artifacts: [
    { id: "local-phase", type: "webm", path: "phase.webm", description: "demo frames", sha256: "local" }
  ]
};

export default function Controls({ onRun, onEvent }) {
  const [edgeList, setEdgeList] = useState(DEFAULT_EDGE_LIST);
  const [density, setDensity] = useState(DEFAULT_DENSITY);
  const [field, setField] = useState(DEFAULT_FIELD);
  const [k, setK] = useState(3);
  const [sites, setSites] = useState(6);
  const [phaseSteps, setPhaseSteps] = useState(64);

  const emit = (emoji, text) => onEvent?.({ emoji, text, ts: new Date().toISOString() });

  const runSpectral = async () => {
    emit("🧪", "Spectral job requested");
    const data = await tryGraphQL(
      `mutation($edgeList: String!, $k: Int!) {
        spectralRun(edgeList: $edgeList, k: $k) {
          id
          status
          metrics
          embedding
          clusters
          artifacts { id type path sha256 description }
        }
      }`,
      { edgeList, k }
    );
    if (data?.spectralRun) {
      onRun({ ...data.spectralRun });
      emit("📈", `Spectral metrics: ${JSON.stringify(data.spectralRun.metrics)}`);
    } else {
      onRun(sampleSpectral);
      emit("📈", "Loaded local spectral preview");
    }
  };

  const runLayout = async () => {
    emit("🧰", "Power-Lloyd job requested");
    const data = await tryGraphQL(
      `mutation($density: String!, $n: Int!) {
        powerLloydRun(density: $density, n: $n) {
          id
          status
          metrics
          density
          movementHistory
          artifacts { id type path sha256 description }
        }
      }`,
      { density, n: sites }
    );
    if (data?.powerLloydRun) {
      onRun({ ...data.powerLloydRun });
      emit("📈", `Layout metrics: ${JSON.stringify(data.powerLloydRun.metrics)}`);
    } else {
      onRun(sampleLayout);
      emit("📈", "Loaded local layout preview");
    }
  };

  const runPhase = async () => {
    emit("📈", "Phase field job requested");
    const data = await tryGraphQL(
      `mutation($field: String!, $steps: Int!) {
        cahnRun(initField: $field, steps: $steps) {
          id
          status
          metrics
          frames
          residuals
          artifacts { id type path sha256 description }
        }
      }`,
      { field, steps: phaseSteps }
    );
    if (data?.cahnRun) {
      onRun({ ...data.cahnRun });
      emit("📈", `Phase metrics: ${JSON.stringify(data.cahnRun.metrics)}`);
    } else {
      onRun(samplePhase);
      emit("📈", "Loaded local phase preview");
    }
  };

  const runPipeline = async () => {
    emit("🧭", "Launching embed→layout→phase pipeline");
    await runSpectral();
    await runLayout();
    await runPhase();
    emit("🎯", "Pipeline complete");
  };

  return (
    <aside className="flex flex-col space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <h2 className="text-lg font-semibold">Controls</h2>
      <label className="text-xs uppercase tracking-wide opacity-60">Edge list</label>
      <textarea className="rounded bg-black/40 p-2 text-sm" rows={4} value={edgeList} onChange={(e) => setEdgeList(e.target.value)} />
      <label className="text-xs uppercase tracking-wide opacity-60">k eigenvectors</label>
      <input className="rounded bg-black/40 p-2 text-sm" type="number" min={2} max={16} value={k} onChange={(e) => setK(Number(e.target.value))} />
      <button className="rounded bg-blue-500/20 px-3 py-2 text-left hover:bg-blue-500/30" onClick={runSpectral}>Run Spectral (k={k}) 🧪</button>

      <label className="text-xs uppercase tracking-wide opacity-60">Density field</label>
      <textarea className="rounded bg-black/40 p-2 text-sm" rows={4} value={density} onChange={(e) => setDensity(e.target.value)} />
      <label className="text-xs uppercase tracking-wide opacity-60">Sites</label>
      <input className="rounded bg-black/40 p-2 text-sm" type="number" min={3} max={32} value={sites} onChange={(e) => setSites(Number(e.target.value))} />
      <button className="rounded bg-emerald-500/20 px-3 py-2 text-left hover:bg-emerald-500/30" onClick={runLayout}>Blue-Noise Layout 🧰</button>

      <label className="text-xs uppercase tracking-wide opacity-60">Phase initial field</label>
      <textarea className="rounded bg-black/40 p-2 text-sm" rows={3} value={field} onChange={(e) => setField(e.target.value)} />
      <label className="text-xs uppercase tracking-wide opacity-60">Steps</label>
      <input className="rounded bg-black/40 p-2 text-sm" type="number" min={16} max={512} value={phaseSteps} onChange={(e) => setPhaseSteps(Number(e.target.value))} />
      <button className="rounded bg-violet-500/20 px-3 py-2 text-left hover:bg-violet-500/30" onClick={runPhase}>Phase Relax 📈</button>

      <button className="rounded bg-orange-500/20 px-3 py-2 text-left hover:bg-orange-500/30" onClick={runPipeline}>Quick Path: Embed → Layout → Phase 🚀</button>
    </aside>
  );
}
