import { useMemo, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function rng(seed) {
  let s = seed | 0 || 2025;
  return () => (s = (1664525 * s + 1013904223) >>> 0) / 2 ** 32;
}
function randn(r) {
  const u = Math.max(r(), 1e-12),
    v = Math.max(r(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function makeSwissRoll(n, seed) {
  const r = rng(seed),
    pts = [];
  for (let i = 0; i < n; i++) {
    const t = 1.5 * Math.PI * (1 + 2 * r());
    const x = t * Math.cos(t),
      y = 21 * r(),
      z = t * Math.sin(t);
    pts.push([x, y, z]);
  }
  return pts;
}
function pairwiseWeights(pts, k = 10, sigma = 10) {
  const n = pts.length;
  const W = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    const dists = [];
    for (let j = 0; j < n; j++) {
      const dx = pts[i][0] - pts[j][0],
        dy = pts[i][1] - pts[j][1],
        dz = pts[i][2] - pts[j][2];
      dists.push([j, dx * dx + dy * dy + dz * dz]);
    }
    dists.sort((a, b) => a[1] - b[1]);
    for (let m = 1; m <= k; m++) {
      const j = dists[m][0],
        d = dists[m][1];
      const w = Math.exp(-d / (2 * sigma * sigma));
      W[i][j] = W[j][i] = Math.max(W[i][j], w);
    }
  }
  return W;
}
function eigenmaps(W, dim = 2) {
  const n = W.length;
  const D = Array(n)
    .fill(0)
    .map((_, i) => W[i].reduce((a, b) => a + b, 0));
  // normalized Laplacian Lsym = I - D^{-1/2} W D^{-1/2}
  const Ms = (v) => {
    const y = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        const wij = W[i][j];
        if (!wij) continue;
        sum += (wij / Math.sqrt((D[i] || 1) * (D[j] || 1))) * v[j];
      }
      y[i] = v[i] - sum; // I - D^-1/2 W D^-1/2
    }
    // center & normalize
    const mean = y.reduce((a, b) => a + b, 0) / n;
    for (let i = 0; i < n; i++) y[i] -= mean;
    const norm = Math.sqrt(y.reduce((a, b) => a + b * b, 0)) || 1;
    for (let i = 0; i < n; i++) y[i] /= norm;
    return y;
  };
  // power iteration for smallest nontrivial eigenvectors: iterate (I - α Lsym) is tricky; use deflation on Ms
  const vecs = [];
  const deflate = (v) => {
    // Gram-Schmidt against previous vecs
    let u = v.slice();
    for (const q of vecs) {
      const dot = u.reduce((s, x, i) => s + x * q[i], 0);
      for (let i = 0; i < n; i++) u[i] -= dot * q[i];
    }
    const norm = Math.sqrt(u.reduce((s, x) => s + x * x, 0)) || 1;
    return u.map((x) => x / norm);
  };
  let v = Array(n)
    .fill(0)
    .map(() => Math.random() * 2 - 1);
  v = deflate(v);
  for (let t = 0; t < 120; t++) v = deflate(Ms(v));
  // Skip trivial eigenvector (constant); build 2 dims
  vecs.push(v);
  for (let d = 1; d <= dim; d++) {
    let z = Array(n)
      .fill(0)
      .map(() => Math.random() * 2 - 1);
    z = deflate(z);
    for (let t = 0; t < 120; t++) z = deflate(Ms(z));
    vecs.push(z);
  }
  // take last dim vectors as coordinates
  const Y = Array.from({ length: n }, (_, i) =>
    vecs.slice(1, dim + 1).map((v) => v[i]),
  );
  return Y;
}

export default function EigenmapsLab() {
  const [n, setN] = useState(500);
  const [k, setK] = useState(10);
  const [sigma, setSigma] = useState(10);
  const [seed, setSeed] = useState(7);

  const pts3 = useMemo(() => makeSwissRoll(n, seed), [n, seed]);
  const W = useMemo(() => pairwiseWeights(pts3, k, sigma), [pts3, k, sigma]);
  const Y = useMemo(() => eigenmaps(W, 2), [W]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">
        Graph Laplacian Eigenmaps — Swiss Roll
      </h2>
      <Scatter pts={Y} />
      <div className="grid" style={{ gridTemplateColumns: "1fr 320px", gap: 16 }}>
        <div />
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="points" v={n} set={setN} min={100} max={1200} step={50} />
          <Slider
            label="neighbors k"
            v={k}
            set={setK}
            min={4}
            max={30}
            step={1}
          />
          <Slider
            label="σ (heat)"
            v={sigma}
            set={setSigma}
            min={2}
            max={30}
            step={1}
          />
          <Slider
            label="seed"
            v={seed}
            set={setSeed}
            min={1}
            max={9999}
            step={1}
          />
          <ActiveReflection
            title="Active Reflection — Eigenmaps"
            storageKey="reflect_eigenmaps"
            prompts={[
              "Lower k: manifold unwrap stays smooth but may fragment—where first?",
              "Increase σ: neighborhoods blur—when do loops collapse?",
              "Why are coordinates only defined up to rotation/scale?",
            ]}
          />
        </section>
      </div>
    </div>
  );
}
function Scatter({ pts }) {
  const W = 640,
    H = 360,
    pad = 20;
  const xs = pts.map((p) => p[0]),
    ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs);
  const minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const X = (x) => pad + ((x - minX) / (maxX - minX + 1e-9)) * (W - 2 * pad);
  const Y = (y) => H - pad - ((y - minY) / (maxY - minY + 1e-9)) * (H - 2 * pad);
  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {pts.map((p, i) => (
          <circle key={i} cx={X(p[0])} cy={Y(p[1])} r="2" />
        ))}
      </svg>
    </section>
  );
}
function Slider({ label, v, set, min, max, step }) {
  const show = typeof v === "number" && v.toFixed ? v.toFixed(2) : v;
  return (
    <div className="mb-2">
      <label className="text-sm opacity-80">
        {label}: <b>{show}</b>
      </label>
      <input
        className="w-full"
        type="range"
        min={min}
        max={max}
        step={step}
        value={v}
        onChange={(e) => set(parseFloat(e.target.value))}
      />
    </div>
  );
}

