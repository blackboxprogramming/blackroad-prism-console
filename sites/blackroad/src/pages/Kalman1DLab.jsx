import { useMemo, useState } from 'react';

/** Simple 1D constant-velocity model inside a not-quite-constant world.
 *  State: x (position). We track one value with Gaussian noise.
 *  x_k = x_{k-1} + w,    w ~ N(0, Q)
 *  z_k = x_k + v,        v ~ N(0, R)
 */
function rng(seed) {
  let s = seed | 0 || 2025;
  return () => (s = (1664525 * s + 1013904223) >>> 0) / 2 ** 32;
}
function randn(r) {
  const u = Math.max(r(), 1e-12),
    v = Math.max(r(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export default function Kalman1DLab() {
  const [N, setN] = useState(120);
  const [Q, setQ] = useState(0.03); // process noise var
  const [R, setR] = useState(0.12); // measurement noise var
  const [seed, setSeed] = useState(42);
  const [trend, setTrend] = useState(0.02); // slow drift

  const sim = useMemo(() => {
    const r = rng(seed);
    const x = [],
      z = [];
    let xk = 0;
    for (let k = 0; k < N; k++) {
      // hidden truth evolves with small drift + noise
      xk = xk + trend + randn(r) * Math.sqrt(Q);
      x.push(xk);
      // measurement with noise
      z.push(xk + randn(r) * Math.sqrt(R));
    }
    // Kalman filter (scalar)
    const xhat = [],
      P = [];
    let xh = 0,
      Pk = 1; // prior
    for (let k = 0; k < N; k++) {
      // predict
      const xh_prior = xh + trend; // model drift included
      const P_prior = Pk + Q;
      // update
      const K = P_prior / (P_prior + R);
      xh = xh_prior + K * (z[k] - xh_prior);
      Pk = (1 - K) * P_prior;
      xhat.push(xh);
      P.push(Pk);
    }
    return { x, z, xhat, P };
  }, [N, Q, R, seed, trend]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Kalman Filter — 1D Tracking</h2>
      <Controls label="samples" v={N} set={setN} min={40} max={400} step={10} />
      <Controls
        label="process var Q"
        v={Q}
        set={setQ}
        min={0.001}
        max={0.3}
        step={0.001}
      />
      <Controls
        label="meas var R"
        v={R}
        set={setR}
        min={0.001}
        max={0.5}
        step={0.001}
      />
      <Controls
        label="trend/drift"
        v={trend}
        set={setTrend}
        min={-0.05}
        max={0.05}
        step={0.001}
      />
      <Controls
        label="seed"
        v={seed}
        set={setSeed}
        min={1}
        max={9999}
        step={1}
      />

      <SeriesPlot truth={sim.x} meas={sim.z} est={sim.xhat} />
      <UncPlot P={sim.P} />
      <p className="text-sm opacity-80">
        Lower R ⇒ trust measurements more; higher Q ⇒ model believes the world
        changes quickly. The filter balances both to minimize mean-square error.
      </p>
    </div>
  );
}

function Controls({ label, v, set, min, max, step }) {
  const show = typeof v === 'number' && v.toFixed ? v.toFixed(3) : v;
  return (
    <div className="mb-1">
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

function SeriesPlot({ truth, meas, est }) {
  const W = 640,
    H = 220,
    pad = 12;
  const N = truth.length;
  const minY = Math.min(...truth, ...meas, ...est);
  const maxY = Math.max(...truth, ...meas, ...est);
  const X = (i) => pad + (i / (N - 1)) * (W - 2 * pad);
  const Y = (v) =>
    H - pad - ((v - minY) / (maxY - minY + 1e-9)) * (H - 2 * pad);
  const poly = (arr) => arr.map((v, i) => `${X(i)},${Y(v)}`).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <rect x="0" y="0" width={W} height={H} fill="none" />
      {/* measurements as faint circles */}
      {meas.map((v, i) => (
        <circle key={i} cx={X(i)} cy={Y(v)} r="2" opacity="0.5" />
      ))}
      {/* truth (dashed) */}
      <polyline
        points={poly(truth)}
        fill="none"
        strokeDasharray="4 4"
        strokeWidth="2"
      />
      {/* estimate */}
      <polyline points={poly(est)} fill="none" strokeWidth="2" />
      <text x={pad} y={14} fontSize="10">
        truth (dashed) • estimate (solid) • measurements (dots)
      </text>
    </svg>
  );
}

function UncPlot({ P }) {
  const W = 640,
    H = 120,
    pad = 12;
  const N = P.length,
    maxP = Math.max(...P, 1e-9);
  const X = (i) => pad + (i / (N - 1)) * (W - 2 * pad);
  const Y = (v) => H - pad - (v / maxP) * (H - 2 * pad);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <text x={pad} y={12} fontSize="10">
        posterior variance Pₖ
      </text>
      {P.map((v, i) => {
        const x1 = i ? X(i - 1) : X(i),
          y1 = i ? Y(P[i - 1]) : Y(v);
        const x2 = X(i),
          y2 = Y(v);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="2" />;
      })}
    </svg>
  );
}
