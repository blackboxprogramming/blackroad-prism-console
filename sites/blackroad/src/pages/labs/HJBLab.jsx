import React, { useMemo, useState } from 'react';
import QuiverView from '../../components/HJB/QuiverView.jsx';
import TrajectoryView from '../../components/HJB/TrajectoryView.jsx';
import ArtifactViewer from '../../components/ArtifactViewer/index.jsx';
import ChatPanel from '../../components/ChatPanel/index.jsx';

const PRESETS = [
  {
    id: 'single-integrator',
    label: 'Single Integrator',
    emoji: '🧭',
    description: 'ẋ = u with quadratic costs towards the origin.',
  },
  {
    id: 'double-integrator',
    label: 'Double Integrator',
    emoji: '🧱',
    description: 'ẋ = v, v̇ = u with light damping.',
  },
  {
    id: 'dubins',
    label: 'Dubins Car',
    emoji: '🛣️',
    description: 'Forward-only car with bounded turning rate.',
  },
];

function createField(preset, resolution = 18) {
  const width = resolution;
  const height = resolution;
  const value = Array.from({ length: height }, (_, y) => {
    return Array.from({ length: width }, (_, x) => {
      const nx = (x / (width - 1)) * 2 - 1;
      const ny = (y / (height - 1)) * 2 - 1;
      if (preset === 'dubins') {
        return Math.hypot(nx, ny) + 0.2 * Math.sin(3 * nx);
      }
      if (preset === 'double-integrator') {
        return 0.5 * (nx * nx + ny * ny) + 0.15 * Math.sin(2 * ny);
      }
      return 0.5 * (nx * nx + ny * ny);
    });
  });

  const policy = Array.from({ length: height }, (_, y) => {
    return Array.from({ length: width }, (_, x) => {
      const nx = (x / (width - 1)) * 2 - 1;
      const ny = (y / (height - 1)) * 2 - 1;
      if (preset === 'dubins') {
        const heading = Math.atan2(ny, nx);
        return [Math.cos(heading + Math.PI / 6), Math.sin(heading + Math.PI / 6)];
      }
      if (preset === 'double-integrator') {
        return [-0.8 * nx - 0.2 * Math.sin(nx * 3), -0.6 * ny];
      }
      return [-nx, -ny];
    });
  });

  return { value, policy, gridSize: { width, height } };
}

function createTrajectory(preset) {
  const samples = [];
  let state = preset === 'dubins' ? [0.8, -0.6] : [0.9, 0.7];
  for (let i = 0; i < 120; i += 1) {
    const t = i * 0.05;
    const control = preset === 'dubins' ? [-Math.sin(t * 0.8), Math.cos(t * 0.4)] : state.map((value) => -0.9 * value);
    state = state.map((value, index) => value + control[index] * 0.05);
    samples.push({ time: t, state: state.slice(), control: control.slice(), stageCost: state.reduce((acc, v) => acc + v * v, 0) });
  }
  return { samples, totalCost: samples.reduce((acc, sample) => acc + sample.stageCost * 0.05, 0) };
}

const SAMPLE_MESSAGES = [
  {
    id: 'hjb-msg-1',
    jobId: 'hjb-lab-demo',
    author: 'Control Agent',
    role: 'agent',
    ts: '2025-02-01T10:15:00.000Z',
    text: '🧭 Dynamics switched to single integrator. Residual dropped below 1e-3 in 640 iterations.',
    reactions: { '📈': 4 },
    attachments: [],
    redactions: [],
  },
  {
    id: 'hjb-msg-2',
    jobId: 'hjb-lab-demo',
    author: 'Control Agent',
    role: 'agent',
    ts: '2025-02-01T10:16:00.000Z',
    text: '🧱 Boundary reflection introduced. Policy fan-out near y=0 changed by < 4°.',
    reactions: { '🧱': 2 },
    attachments: [],
    redactions: [],
  },
  {
    id: 'hjb-msg-3',
    jobId: 'hjb-lab-demo',
    author: 'Operator',
    role: 'user',
    ts: '2025-02-01T10:17:00.000Z',
    text: '/rerun mode=pde preset=dubins cfl=0.75',
    reactions: {},
    attachments: [],
    redactions: [],
  },
];

function createArtifacts(field, trajectory) {
  return [
    {
      id: 'value-grid',
      kind: 'json',
      name: 'Value Grid (excerpt)',
      json: field.value.slice(0, 6).map((row) => row.slice(0, 6)),
    },
    {
      id: 'policy-grid',
      kind: 'json',
      name: 'Policy Vectors (excerpt)',
      json: field.policy.slice(0, 6).map((row) => row.slice(0, 6)),
    },
    {
      id: 'rollout-log',
      kind: 'json',
      name: 'Rollout Trace',
      json: trajectory.samples.slice(0, 10),
    },
    {
      id: 'metrics-table',
      kind: 'table',
      name: 'Solver Metrics',
      rows: [
        ['Metric', 'Value'],
        ['Residual', '9.8e-4'],
        ['Iterations', '640'],
        ['CFL', '0.82'],
      ],
    },
  ];
}

export default function HJBLab() {
  const [presetId, setPresetId] = useState('single-integrator');
  const [mode, setMode] = useState('pde');

  const field = useMemo(() => createField(presetId, mode === 'pde' ? 22 : 16), [presetId, mode]);
  const trajectory = useMemo(() => createTrajectory(presetId), [presetId]);
  const artifacts = useMemo(() => createArtifacts(field, trajectory), [field, trajectory]);

  return (
    <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_1fr]">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <header className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-slate-900">Hamilton–Jacobi–Bellman Control Lab</h1>
          <p className="text-sm text-slate-600">
            Design dynamics, inspect value gradients, and test rollouts with instant artifacts.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-700">Dynamics</span>
            <select
              value={presetId}
              onChange={(event) => setPresetId(event.target.value)}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
            >
              {PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.emoji} {preset.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500">
              {PRESETS.find((item) => item.id === presetId)?.description}
            </span>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-700">Solver Path</span>
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
            >
              <option value="pde">PDE — Upwind / Godunov</option>
              <option value="mdp">MDP — Value Iteration</option>
            </select>
            <span className="text-xs text-slate-500">
              {mode === 'pde'
                ? '🧪 Residual drops until tolerance; quiver renders -∇V and controls.'
                : '⚖️ Gauss–Seidel sweep over lattice with greedy policy readout.'}
            </span>
          </label>
        </div>

        <QuiverView valueField={field.value} policyField={field.policy} gridSize={field.gridSize} />
        <TrajectoryView trajectory={trajectory} />
      </section>

      <section className="flex h-full flex-col gap-4">
        <ArtifactViewer jobId={null} artifacts={artifacts} />
        <ChatPanel jobId={null} initialMessages={SAMPLE_MESSAGES} permissions={{ canPost: false }} />
      </section>
    </div>
  );
}
