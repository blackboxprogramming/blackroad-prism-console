import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

// periodic boundary
const idx = (i, n) => (i < 0 ? i + n : i >= n ? i - n : i);

function rng(seed) {
  let s = seed | 0 || 2025;
  return () => ((s = (1664525 * s + 1013904223) >>> 0) / 2 ** 32);
}

export default function Ising2DLab() {
  const [N, setN] = useState(64); // grid N x N
  const [T, setT] = useState(2.2); // temperature (k_B=1, J=1)
  const [sweeps, setSweeps] = useState(2); // sweeps per frame
  const [seed, setSeed] = useState(42);
  const [running, setRunning] = useState(true);

  const canvasRef = useRef(null);
  const sim = useMemo(() => initSim(N, seed), [N, seed]);

  // draw + step
  useEffect(() => {
    const cnv = canvasRef.current;
    if (!cnv) return;
    const ctx = cnv.getContext("2d", { alpha: false });
    cnv.width = N;
    cnv.height = N;
    let raf;
    const step = () => {
      if (running) {
        for (let s = 0; s < sweeps; s++) metropolisSweep(sim, T);
      }
      draw(ctx, sim);
      raf = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(raf);
  }, [sim, N, T, sweeps, running]);

  const stats = useMemo(() => {
    const { E, M } = energyMag(sim);
    return { E, M, m: Math.abs(M) / (N * N) };
  }, [sim, N, T, sweeps, running]); // recompute whenever

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Ising 2-D — Metropolis</h2>
      <div className="grid" style={{ gridTemplateColumns: "1fr 300px", gap: 16 }}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <canvas ref={canvasRef} style={{ width: "100%", imageRendering: "pixelated" }} />
          <p className="text-sm mt-2">
            Magnetization |m| ≈ <b>{stats.m.toFixed(3)}</b> • Energy E ≈ <b>{stats.E.toFixed(0)}</b>
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setRunning((r) => !r)}
              className="px-3 py-1 rounded bg-white/10 border border-white/10"
            >
              {running ? "Pause" : "Run"}
            </button>
            <button
              onClick={() => randomize(sim)}
              className="px-3 py-1 rounded bg-white/10 border border-white/10"
            >
              Randomize
            </button>
            <button
              onClick={() => allUp(sim)}
              className="px-3 py-1 rounded bg-white/10 border border-white/10"
            >
              All ↑
            </button>
          </div>
        </section>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <h3 className="font-semibold mb-2">Controls</h3>
          <Slider label="N (grid)" v={N} set={setN} min={32} max={96} step={8} />
          <Slider label="T (temperature)" v={T} set={setT} min={0.5} max={3.5} step={0.05} />
          <Slider label="sweeps/frame" v={sweeps} set={setSweeps} min={1} max={10} step={1} />
          <Slider label="seed" v={seed} set={setSeed} min={1} max={9999} step={1} />
          <ActiveReflection
            title="Active Reflection — Ising"
            storageKey="reflect_ising"
            prompts={[
              "Below a certain T the system forms large aligned domains (spontaneous order). Did you see it?",
              "Near T≈2.27 (2-D critical point) patterns become turbulent; what happens to |m|?",
              "How does raising T change acceptance of flips and the texture?",
              "What initial condition (random vs all-up) matters at high vs low T?",
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function initSim(N, seed) {
  const r = rng(seed);
  const spins = Array.from({ length: N }, () =>
    Array(N)
      .fill(0)
      .map(() => (r() < 0.5 ? -1 : +1))
  );
  return { N, spins, r };
}

function localDeltaE(sim, i, j) {
  const { N, spins } = sim;
  const s = spins[i][j];
  const nn =
    spins[idx(i - 1, N)][j] +
    spins[idx(i + 1, N)][j] +
    spins[i][idx(j - 1, N)] +
    spins[i][idx(j + 1, N)];
  const dE = 2 * s * nn; // J=1
  return dE;
}
function metropolisSweep(sim, T) {
  const { N, spins, r } = sim;
  for (let k = 0; k < N * N; k++) {
    const i = (r() * N) | 0;
    const j = (r() * N) | 0;
    const dE = localDeltaE(sim, i, j);
    if (dE <= 0 || r() < Math.exp(-dE / T)) spins[i][j] *= -1;
  }
}
function draw(ctx, sim) {
  const { N, spins } = sim;
  const img = ctx.createImageData(N, N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const s = spins[y][x];
      const on = s > 0;
      const off = 4 * (y * N + x);
      const v = on ? 245 : 20;
      img.data[off + 0] = v;
      img.data[off + 1] = v;
      img.data[off + 2] = v;
      img.data[off + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}
function energyMag(sim) {
  const { N, spins } = sim;
  let E = 0;
  let M = 0;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const s = spins[i][j];
      const right = spins[i][idx(j + 1, N)];
      const down = spins[idx(i + 1, N)][j];
      E += -s * right - s * down;
      M += s;
    }
  }
  return { E, M };
}
function randomize(sim) {
  const { N, r, spins } = sim;
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) spins[i][j] = r() < 0.5 ? -1 : +1;
}
function allUp(sim) {
  const { N, spins } = sim;
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) spins[i][j] = +1;
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
