import { useMemo, useState } from 'react';

function normalizeCols(M) {
  const n = M.length,
    m = M[0].length;
  const out = Array.from({ length: n }, () => Array(m).fill(0));
  for (let j = 0; j < m; j++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += M[i][j];
    const d = s > 0 ? s : 1;
    for (let i = 0; i < n; i++) out[i][j] = M[i][j] / d;
  }
  return out;
}
function matVec(M, v) {
  const n = M.length,
    res = new Array(n).fill(0);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) res[i] += M[i][j] * v[j];
  return res;
}
function addVec(a, b, alpha = 1) {
  return a.map((x, i) => x + alpha * b[i]);
}
function scaleVec(a, c) {
  return a.map((x) => x * c);
}
function l1norm(a) {
  return a.reduce((s, x) => s + Math.abs(x), 0);
}

export default function PageRankLab() {
  const [n, setN] = useState(6);
  const [density, setDensity] = useState(0.35);
  const [damp, setDamp] = useState(0.85);
  const [iters, setIters] = useState(60);
  const [seed, setSeed] = useState(7);

  // build random directed graph adjacency
  const adj = useMemo(() => {
    let s = seed | 0;
    const rand = () => (s = (1103515245 * s + 12345) >>> 0) / 2 ** 32;
    const A = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        if (rand() < density) A[i][j] = 1;
      }
      // ensure at least one outgoing
      if (A[i].every((v) => v === 0)) {
        const j = Math.floor((n - 1) * rand());
        A[i][j >= i ? j + 1 : j] = 1;
      }
    }
    return A;
  }, [n, density, seed]);

  const pr = useMemo(() => {
    // column-stochastic P from adjacency (links go out of j to i)
    const P = normalizeCols(
      adj.map((row) => row.slice()).transpose?.() || transpose(adj)
    );
    const nN = P.length;
    // Google matrix: G = d*P + (1-d)*(1/n)ee^T
    const base = 1 / nN;
    let v = Array(nN).fill(1 / nN);
    for (let k = 0; k < iters; k++) {
      const Pv = matVec(P, v);
      const vnext = addVec(
        scaleVec(Pv, damp),
        Array(nN).fill((1 - damp) * base)
      );
      if (l1norm(vnext.map((x, i) => x - v[i])) < 1e-10) {
        v = vnext;
        break;
      }
      v = vnext;
    }
    return v;
  }, [adj, damp, iters]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">PageRank / Markov Lab</h2>
      <Controls label="nodes" v={n} set={setN} min={3} max={18} step={1} />
      <Controls
        label="density"
        v={density}
        set={setDensity}
        min={0.05}
        max={0.9}
        step={0.01}
      />
      <Controls
        label="damping (1-teleport)"
        v={damp}
        set={setDamp}
        min={0.5}
        max={0.99}
        step={0.01}
      />
      <Controls
        label="iterations"
        v={iters}
        set={setIters}
        min={10}
        max={300}
        step={5}
      />
      <Controls
        label="seed"
        v={seed}
        set={setSeed}
        min={1}
        max={9999}
        step={1}
      />
      <Graph adj={adj} pr={pr} />
      <Bar pr={pr} />
      <p className="text-sm opacity-80">
        Bigger bar = higher stationary probability. Raise damping to trust links
        more; lower it for more teleport.
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

function transpose(A) {
  const n = A.length,
    m = A[0].length;
  const T = Array.from({ length: m }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) T[j][i] = A[i][j];
  return T;
}

function Graph({ adj, pr }) {
  const W = 640,
    H = 240,
    pad = 24,
    n = adj.length;
  const R = 80,
    cx = W / 2,
    cy = H / 2;
  const nodes = Array.from({ length: n }, (_, i) => {
    const ang = (2 * Math.PI * i) / n;
    return { x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang) };
  });
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {/* edges */}
      {adj.map((row, i) =>
        row.map((v, j) =>
          v ? <Arrow key={`${i}-${j}`} from={nodes[i]} to={nodes[j]} /> : null
        )
      )}
      {/* nodes */}
      {nodes.map((p, i) => {
        const r = 6 + 20 * (pr[i] || 0);
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={r} />
            <text x={p.x + 10} y={p.y - 10} fontSize="10">
              #{i}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
function Arrow({ from, to }) {
  const dx = to.x - from.x,
    dy = to.y - from.y,
    L = Math.hypot(dx, dy);
  const ux = dx / L,
    uy = dy / L;
  const ax = to.x - ux * 10,
    ay = to.y - uy * 10;
  const left = { x: ax - uy * 4, y: ay + ux * 4 };
  const right = { x: ax + uy * 4, y: ay - ux * 4 };
  return (
    <g opacity="0.6">
      <line x1={from.x} y1={from.y} x2={ax} y2={ay} />
      <polygon
        points={`${ax},${ay} ${left.x},${left.y} ${right.x},${right.y}`}
      />
    </g>
  );
}
function Bar({ pr }) {
  const W = 640,
    H = 120,
    pad = 10,
    n = pr.length;
  const maxV = Math.max(...pr, 1e-9);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {pr.map((v, i) => {
        const x = pad + i * ((W - 2 * pad) / n);
        const w = ((W - 2 * pad) / n) * 0.95;
        const h = (H - 2 * pad) * (v / maxV);
        return (
          <rect
            key={i}
            x={x}
            y={H - pad - h}
            width={w}
            height={h}
            rx="2"
            ry="2"
          />
        );
      })}
      <text x={pad} y={12} fontSize="10">
        Stationary distribution (PageRank)
      </text>
    </svg>
  );
}
