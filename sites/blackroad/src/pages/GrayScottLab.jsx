import { useEffect, useMemo, useRef, useState } from 'react';
import ActiveReflection from './ActiveReflection.jsx';

/** u_t = Du ∇²u - u v^2 + F(1-u)
 *  v_t = Dv ∇²v + u v^2 - (F+k) v
 *  Explicit Euler + 5-point Laplacian, CFL small for stability
 */
function clamp(x, a, b) {
  return x < a ? a : x > b ? b : x;
}

export default function GrayScottLab() {
  const [N, setN] = useState(160);
  const [Du, setDu] = useState(0.16),
    [Dv, setDv] = useState(0.08);
  const [F, setF] = useState(0.06),
    [k, setK] = useState(0.062);
  const [dt, setDT] = useState(1.0);
  const [running, setRunning] = useState(true);
  const cnv = useRef(null);

  const sim = useMemo(() => init(N), [N]);

  useEffect(() => {
    const c = cnv.current;
    if (!c) return;
    const ctx = c.getContext('2d', { alpha: false });
    c.width = N;
    c.height = N;
    let raf;
    const step = () => {
      if (running) evolve(sim, Du, Dv, F, k, dt, 10);
      render(ctx, sim);
      raf = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(raf);
  }, [sim, Du, Dv, F, k, dt, running]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Gray–Scott Reaction–Diffusion</h2>
      <div
        className="grid"
        style={{ gridTemplateColumns: '1fr 320px', gap: 16 }}
      >
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <canvas
            ref={cnv}
            style={{ width: '100%', imageRendering: 'pixelated' }}
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setRunning((r) => !r)}
              className="px-3 py-1 rounded bg-white/10 border border-white/10"
            >
              {running ? 'Pause' : 'Run'}
            </button>
            <button
              onClick={() => seed(sim)}
              className="px-3 py-1 rounded bg-white/10 border border-white/10"
            >
              Reseed
            </button>
          </div>
        </section>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider
            label="N (grid)"
            v={N}
            set={setN}
            min={80}
            max={240}
            step={20}
          />
          <Slider
            label="Du"
            v={Du}
            set={setDu}
            min={0.01}
            max={0.4}
            step={0.005}
          />
          <Slider
            label="Dv"
            v={Dv}
            set={setDv}
            min={0.01}
            max={0.4}
            step={0.005}
          />
          <Slider
            label="F (feed)"
            v={F}
            set={setF}
            min={0.0}
            max={0.08}
            step={0.001}
          />
          <Slider
            label="k (kill)"
            v={k}
            set={setK}
            min={0.0}
            max={0.08}
            step={0.001}
          />
          <Slider
            label="dt"
            v={dt}
            set={setDT}
            min={0.2}
            max={2.0}
            step={0.05}
          />
          <ActiveReflection
            title="Active Reflection — Gray–Scott"
            storageKey="reflect_grayscott"
            prompts={[
              'Find classic spot (F≈0.04,k≈0.06) vs stripe (Turing) patterns—how do Du,Dv change texture?',
              'What happens if you double dt? Stability vs speed tradeoff?',
              'Reseed near a corner: do waves interact or annihilate?',
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function init(N) {
  const u = Array.from({ length: N }, () => Array(N).fill(1));
  const v = Array.from({ length: N }, () => Array(N).fill(0));
  // seed: small square in center
  for (let y = (N / 2 - 8) | 0; (y < N / 2 + 8) | 0; y++)
    for (let x = (N / 2 - 8) | 0; (x < N / 2 + 8) | 0; x++) {
      u[y][x] = 0.5;
      v[y][x] = 0.25;
    }
  return { N, u, v, tmpu: copy(u), tmpv: copy(v) };
}
function copy(A) {
  return A.map((r) => r.slice());
}
function lap(A, x, y, N) {
  const xm = (x - 1 + N) % N,
    xp = (x + 1) % N,
    ym = (y - 1 + N) % N,
    yp = (y + 1) % N;
  return A[y][x] * -4 + A[y][xp] + A[y][xm] + A[yp][x] + A[ym][x];
}
function evolve(sim, Du, Dv, F, k, dt, substeps = 1) {
  const { N, u, v, tmpu, tmpv } = sim;
  const sdt = dt / substeps;
  for (let s = 0; s < substeps; s++) {
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const uvv = u[y][x] * v[y][x] * v[y][x];
        const du = Du * lap(u, x, y, N) - uvv + F * (1 - u[y][x]);
        const dv = Dv * lap(v, x, y, N) + uvv - (F + k) * v[y][x];
        tmpu[y][x] = clamp(u[y][x] + sdt * du, 0, 1);
        tmpv[y][x] = clamp(v[y][x] + sdt * dv, 0, 1);
      }
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        u[y][x] = tmpu[y][x];
        v[y][x] = tmpv[y][x];
      }
    }
  }
}
function seed(sim) {
  const { N, u, v } = sim;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      u[y][x] = 1;
      v[y][x] = 0;
    }
  for (let y = (N / 2 - 8) | 0; (y < N / 2 + 8) | 0; y++)
    for (let x = (N / 2 - 8) | 0; (x < N / 2 + 8) | 0; x++) {
      u[y][x] = 0.5;
      v[y][x] = 0.25;
    }
}
function render(ctx, sim) {
  const { N, u, v } = sim;
  const img = ctx.createImageData(N, N);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const a = u[y][x],
        b = v[y][x];
      // map to soothing palette using u, v
      const r = Math.floor(255 * Math.pow(a, 0.5));
      const g = Math.floor(255 * (0.5 * b + 0.5 * a));
      const bch = Math.floor(255 * Math.pow(b, 0.5));
      const off = 4 * (y * N + x);
      img.data[off + 0] = r;
      img.data[off + 1] = g;
      img.data[off + 2] = bch;
      img.data[off + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
}
function Slider({ label, v, set, min, max, step }) {
  const show = typeof v === 'number' && v.toFixed ? v.toFixed(3) : v;
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
