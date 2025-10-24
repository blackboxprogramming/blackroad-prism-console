import { useCallback, useMemo, useState } from "react";
import ActiveReflection from "../ActiveReflection.jsx";
import SinkhornTuner from "../../components/SinkhornTuner.jsx";
import BarycentricPreview from "../../components/BarycentricPreview.jsx";

function normalise(weights) {
  const sum = weights.reduce((acc, value) => acc + value, 0);
  return weights.map((value) => value / sum);
}

function gaussianGrid(size, center, sigma) {
  const values = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center[0];
      const dy = y - center[1];
      const exponent = -(dx * dx + dy * dy) / (2 * sigma * sigma);
      values.push(Math.exp(exponent));
    }
  }
  return values;
}

function costMatrix(pointsA, pointsB, metric) {
  const rows = pointsA.length;
  const cols = pointsB.length;
  const matrix = new Array(rows * cols).fill(0);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const idx = i * cols + j;
      if (metric === "cosine") {
        const dot = pointsA[i][0] * pointsB[j][0] + pointsA[i][1] * pointsB[j][1];
        const lenA = Math.hypot(pointsA[i][0], pointsA[i][1]) || 1;
        const lenB = Math.hypot(pointsB[j][0], pointsB[j][1]) || 1;
        matrix[idx] = 1 - dot / (lenA * lenB);
      } else if (metric === "tv_l1") {
        matrix[idx] = Math.abs(pointsA[i][0] - pointsB[j][0]) + Math.abs(pointsA[i][1] - pointsB[j][1]);
      } else {
        const dx = pointsA[i][0] - pointsB[j][0];
        const dy = pointsA[i][1] - pointsB[j][1];
        matrix[idx] = dx * dx + dy * dy;
      }
    }
  }
  return matrix;
}

function logSumExp(values) {
  const max = Math.max(...values);
  if (!Number.isFinite(max)) return -Infinity;
  let sum = 0;
  for (const value of values) {
    sum += Math.exp(value - max);
  }
  return max + Math.log(sum);
}

function runSinkhorn(mu, nu, cost, rows, cols, epsilon, iterations, tol) {
  const logKernel = cost.map((value) => -value / epsilon);
  const logU = new Array(rows).fill(0);
  const logV = new Array(cols).fill(0);
  const logMu = mu.map((value) => Math.log(Math.max(value, Number.EPSILON)));
  const logNu = nu.map((value) => Math.log(Math.max(value, Number.EPSILON)));
  const history = [];
  let converged = false;

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < rows; i++) {
      const slice = new Array(cols);
      for (let j = 0; j < cols; j++) {
        slice[j] = logKernel[i * cols + j] + logV[j];
      }
      logU[i] = logMu[i] - logSumExp(slice);
    }

    for (let j = 0; j < cols; j++) {
      const slice = new Array(rows);
      for (let i = 0; i < rows; i++) {
        slice[i] = logKernel[i * cols + j] + logU[i];
      }
      logV[j] = logNu[j] - logSumExp(slice);
    }

    if (iter % 5 === 0 || iter === iterations - 1) {
      let maxResidual = 0;
      for (let i = 0; i < rows; i++) {
        let sumRow = 0;
        for (let j = 0; j < cols; j++) {
          sumRow += Math.exp(logKernel[i * cols + j] + logU[i] + logV[j]);
        }
        maxResidual = Math.max(maxResidual, Math.abs(sumRow - mu[i]));
      }
      for (let j = 0; j < cols; j++) {
        let sumCol = 0;
        for (let i = 0; i < rows; i++) {
          sumCol += Math.exp(logKernel[i * cols + j] + logU[i] + logV[j]);
        }
        maxResidual = Math.max(maxResidual, Math.abs(sumCol - nu[j]));
      }
      history.push({ iteration: iter, residual: maxResidual });
      if (maxResidual < tol) {
        converged = true;
        break;
      }
    }
  }

  const coupling = new Array(rows * cols);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      coupling[i * cols + j] = Math.exp(logKernel[i * cols + j] + logU[i] + logV[j]);
    }
  }

  return { coupling, converged, history };
}

function barycentricMap(coupling, pointsB, rows, cols) {
  const map = Array.from({ length: rows }, () => [0, 0]);
  for (let i = 0; i < rows; i++) {
    let denom = 0;
    for (let j = 0; j < cols; j++) {
      const weight = coupling[i * cols + j];
      denom += weight;
      map[i][0] += weight * pointsB[j][0];
      map[i][1] += weight * pointsB[j][1];
    }
    if (denom > 0) {
      map[i][0] /= denom;
      map[i][1] /= denom;
    }
  }
  return map;
}

function reshape(values, width) {
  const rows = [];
  for (let i = 0; i < values.length; i += width) {
    rows.push(values.slice(i, i + width));
  }
  return rows;
}

function buildDefaultDistributions(size = 16) {
  const points = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      points.push([x / size, y / size]);
    }
  }
  const muValues = gaussianGrid(size, [size * 0.35, size * 0.35], size * 0.18);
  const nuValues = gaussianGrid(size, [size * 0.65, size * 0.65], size * 0.22);
  return {
    points,
    size,
    mu: normalise(muValues),
    nu: normalise(nuValues)
  };
}

const PROMPTS = [
  "What structure does ε preserve? When does it over-smooth?",
  "How quickly do marginals balance as you change iterations?",
  "Switch to cosine cost: what deformations survive the bridge?"
];

export default function SBLab() {
  const defaults = useMemo(() => buildDefaultDistributions(18), []);
  const [config, setConfig] = useState({ epsilon: 0.05, iterations: 400, tolerance: 1e-4, cost: "l2" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const rows = defaults.mu.length;
  const cols = defaults.nu.length;

  const solve = useCallback(async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 30));
    try {
      const cost = costMatrix(defaults.points, defaults.points, config.cost);
      const solved = runSinkhorn(defaults.mu, defaults.nu, cost, rows, cols, config.epsilon, config.iterations, config.tolerance);
      const bary = barycentricMap(solved.coupling, defaults.points, rows, cols);
      const gridSide = defaults.size;
      const map = reshape(bary.map((entry) => entry[0]), gridSide);
      setResult({
        ...solved,
        map,
        stats: {
          residual: solved.history.at(-1)?.residual ?? null,
          iterations: solved.history.length ? solved.history.at(-1).iteration : 0
        }
      });
    } finally {
      setLoading(false);
    }
  }, [config, defaults, rows, cols]);

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Schrödinger Bridge — Entropic Sinkhorn</h1>
        <p className="max-w-3xl text-sm opacity-80">
          Minimal regret transport between two clouds with entropy as guidance. Tune ε to feel the trade-off between crisp mass transfer
          and smooth diffusion. The FigJam tile in Codex Prompt 007 maps this flow from cost design → Sinkhorn iterations → barycentric
          interpolation.
        </p>
      </header>
      <div className="grid gap-4" style={{ gridTemplateColumns: "minmax(0,1fr) 320px" }}>
        <section className="space-y-4">
          <button
            className="px-3 py-2 rounded bg-gradient-to-r from-emerald-500 to-sky-500 text-black font-semibold disabled:opacity-50"
            onClick={solve}
            disabled={loading}
          >
            {loading ? "Solving…" : "Run Sinkhorn"}
          </button>
          {result && (
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <BarycentricPreview map={result.map} />
              <section className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-2">
                <h3 className="font-semibold">Diagnostics</h3>
                <div className="text-sm space-y-1 font-mono">
                  <div>iterations: {result.stats.iterations}</div>
                  <div>residual: {result.stats.residual?.toExponential?.(3) ?? "—"}</div>
                  <div>converged: {result.converged ? "yes" : "no"}</div>
                </div>
                <div className="text-xs opacity-70">
                  Residual is the max |π·1 − μ| or |πᵗ·1 − ν|. Lower ε sharpens structure but may demand more iterations.
                </div>
              </section>
            </div>
          )}
        </section>
        <SinkhornTuner config={config} onChange={setConfig} />
      </div>
      <ActiveReflection
        title="Active Reflection — Schrödinger Bridge"
        storageKey="reflect_sb_lab"
        prompts={PROMPTS}
      />
import React, { useMemo } from 'react';
import ArtifactViewer from '../../components/ArtifactViewer/index.jsx';
import ChatPanel from '../../components/ChatPanel/index.jsx';

const SAMPLE_ARTIFACTS = [
  {
    id: 'sb-frame-1',
    kind: 'image',
    name: 'Simulation Snapshot',
    url: '/static/labs/sb/frame-001.png',
    downloadUrl: '/static/labs/sb/frame-001.png',
    caption: 'Score-based sampler at step 250.',
  },
  {
    id: 'sb-metrics',
    kind: 'json',
    name: 'Sampler Metrics',
    json: { step: 250, divergence: 0.014, temperature: 0.72 },
  },
];

const SAMPLE_MESSAGES = [
  {
    id: 'msg-1',
    jobId: 'sb-lab-demo',
    author: 'Ops Agent',
    role: 'agent',
    ts: '2025-01-15T12:00:00.000Z',
    text: 'Sampler converged on manifold drift check.',
    reactions: { '👍': 3, '🧪': 1 },
    attachments: [{ kind: 'image', url: '/static/labs/sb/frame-001.png' }],
    redactions: [],
  },
];

export default function SBLab() {
  const artifacts = useMemo(() => SAMPLE_ARTIFACTS, []);
  const messages = useMemo(() => SAMPLE_MESSAGES, []);
  const jobId = 'sb-lab-demo';

  return (
    <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_1fr]">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Score-Based Lab</h1>
        <p className="mt-2 text-sm text-slate-600">
          Monitor sampler health, inspect generated frames, and coordinate reruns with the ops agent.
        </p>
        <ArtifactViewer jobId={jobId} artifacts={artifacts} />
      </section>
      <ChatPanel jobId={jobId} protocol="graphql" initialMessages={messages} />
    </div>
  );
}
