import { useMemo, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function rng(seed) {
  let s = seed | 0 || 1234;
  return () => ((s = (1664525 * s + 1013904223) >>> 0) / 2 ** 32);
}
function randn(r) {
  const u = Math.max(r(), 1e-12),
    v = Math.max(r(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export default function PCALab() {
  const [n, setN] = useState(300);
  const [sx, setSx] = useState(2.0),
    [sy, setSy] = useState(0.8);
  const [rho, setRho] = useState(0.75);
  const [seed, setSeed] = useState(7);

  const pts = useMemo(() => {
    const r = rng(seed);
    const out = [];
    for (let i = 0; i < n; i++) {
      // correlated Gaussian via Cholesky
      const z1 = randn(r),
        z2 = randn(r);
      const x = sx * z1;
      const y = sy * (rho * z1 + Math.sqrt(Math.max(0, 1 - rho * rho)) * z2);
      out.push([x, y]);
    }
    return out;
  }, [n, sx, sy, rho, seed]);

  const { cov, evals, evecs } = useMemo(() => pca2d(pts), [pts]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">PCA Playground — 2D</h2>
      <div className="grid" style={{ gridTemplateColumns: "1fr 320px", gap: 16 }}>
        <ScatterWithAxes pts={pts} evals={evals} evecs={evecs} />
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <h3 className="font-semibold mb-2">Controls</h3>
          <Slider label="points" v={n} set={setN} min={100} max={1000} step={50} />
          <Slider label="σx" v={sx} set={setSx} min={0.2} max={3.0} step={0.05} />
          <Slider label="σy" v={sy} set={setSy} min={0.2} max={3.0} step={0.05} />
          <Slider label="ρ (corr)" v={rho} set={setRho} min={-0.95} max={0.95} step={0.01} />
          <Slider label="seed" v={seed} set={setSeed} min={1} max={9999} step={1} />
          <p className="text-sm mt-2">
            λ₁≈{evals[0].toFixed(2)} • λ₂≈{evals[1].toFixed(2)} (variance captured)
          </p>
          <ActiveReflection
            title="Active Reflection — PCA"
            storageKey="reflect_pca"
            prompts={[
              "Rotate/correlate the cloud: does the first eigenvector align with the long axis?",
              "How do λ₁, λ₂ change when σx or σy grows?",
              "When ρ→±1, what happens to λ₂? Why?",
              "If you projected data onto PC1 vs PC2, what info would you lose/gain?"
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function pca2d(pts) {
  const n = pts.length || 1;
  let mx = 0,
    my = 0;
  for (const [x, y] of pts) {
    mx += x;
    my += y;
  }
  mx /= n;
  my /= n;
  let sxx = 0,
    sxy = 0,
    syy = 0;
  for (const [x, y] of pts) {
    const dx = x - mx,
      dy = y - my;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }
  sxx /= n;
  sxy /= n;
  syy /= n;
  const cov = [
    [sxx, sxy],
    [sxy, syy],
  ];
  // closed-form eigen for 2x2 symmetric
  const tr = sxx + syy;
  const det = sxx * syy - sxy * sxy;
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const l1 = tr / 2 + disc,
    l2 = tr / 2 - disc;
  const v1 = normalize(sxy !== 0 ? [l1 - syy, sxy] : sxx >= syy ? [1, 0] : [0, 1]);
  const v2 = normalize([-v1[1], v1[0]]);
  return { cov, evals: [l1, l2], evecs: [v1, v2] };
}
function normalize([x, y]) {
  const n = Math.hypot(x, y) || 1;
  return [x / n, y / n];
}

function ScatterWithAxes({ pts, evals, evecs }) {
  const W = 640,
    H = 360,
    pad = 20;
  const xs = pts.map((p) => p[0]),
    ys = pts.map((p) => p[1]);
  const minX = Math.min(-1, ...xs),
    maxX = Math.max(1, ...xs);
  const minY = Math.min(-1, ...ys),
    maxY = Math.max(1, ...ys);
  const X = (x) => pad + ((x - minX) / (maxX - minX + 1e-9)) * (W - 2 * pad);
  const Y = (y) => H - pad - ((y - minY) / (maxY - minY + 1e-9)) * (H - 2 * pad);

  const center = [(minX + maxX) / 2, (minY + maxY) / 2];
  const scale = Math.sqrt(evals[0]);
  const p1 = [
    center[0] + evecs[0][0] * scale * 2.5,
    center[1] + evecs[0][1] * scale * 2.5,
  ];
  const p1n = [
    center[0] - evecs[0][0] * scale * 2.5,
    center[1] - evecs[0][1] * scale * 2.5,
  ];
  const p2 = [
    center[0] + evecs[1][0] * Math.sqrt(evals[1]) * 2.5,
    center[1] + evecs[1][1] * Math.sqrt(evals[1]) * 2.5,
  ];
  const p2n = [
    center[0] - evecs[1][0] * Math.sqrt(evals[1]) * 2.5,
    center[1] - evecs[1][1] * Math.sqrt(evals[1]) * 2.5,
  ];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <rect x="0" y="0" width={W} height={H} fill="none" />
      {/* points */}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={X(x)} cy={Y(y)} r="2" />
      ))}
      {/* principal axes */}
      <line
        x1={X(p1n[0])}
        y1={Y(p1n[1])}
        x2={X(p1[0])}
        y2={Y(p1[1])}
        strokeWidth="3"
      />
      <line
        x1={X(p2n[0])}
        y1={Y(p2n[1])}
        x2={X(p2[0])}
        y2={Y(p2[1])}
        strokeWidth="2"
      />
      <text x={20} y={20} fontSize="10">
        PC1 λ₁={evals[0].toFixed(2)}
      </text>
      <text x={20} y={34} fontSize="10">
        PC2 λ₂={evals[1].toFixed(2)}
      </text>
    </svg>
  );
}

function Slider({ label, v, set, min, max, step }) {
  const show = typeof v === "number" && v.toFixed ? v.toFixed(3) : v;
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
