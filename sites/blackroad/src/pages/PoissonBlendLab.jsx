import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

/** We synthesize a 'source' pattern and a 'target' background, define a circular mask,
 *  then solve ∆u = ∆s inside mask with u = target on boundary (Jacobi relaxation).
 */
function makePatterns(N) {
  const src = Array.from({ length: N }, () => Array(N).fill(0));
  const dst = Array.from({ length: N }, () => Array(N).fill(0));
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const u = x / N,
        v = y / N;
      // dst: smooth gradient + gentle waves
      dst[y][x] = 0.4 + 0.3 * Math.sin(4 * Math.PI * u) * Math.sin(4 * Math.PI * v);
      // src: a logo-like cross
      const cx = 0.5,
        cy = 0.5;
      const dx = Math.abs(u - cx),
        dy = Math.abs(v - cy);
      const cross = dx < 0.08 || dy < 0.08 ? 1 : 0;
      src[y][x] = 0.2 + 0.7 * cross;
    }
  return { src, dst };
}
function circleMask(N, r = 0.22, cx = 0.55, cy = 0.52) {
  const M = Array.from({ length: N }, () => Array(N).fill(false));
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const u = x / N,
        v = y / N;
      M[y][x] = (u - cx) * (u - cx) + (v - cy) * (v - cy) <= r * r;
    }
  return M;
}
function blendPoisson(src, dst, mask, iters = 1000) {
  const N = src.length;
  const u = Array.from({ length: N }, () => Array(N).fill(0));
  // initialize u with dst
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) u[y][x] = dst[y][x];
  // Jacobi relaxation: ∆u = ∆src inside mask; u=dst outside
  for (let k = 0; k < iters; k++) {
    const nu = Array.from({ length: N }, () => Array(N).fill(0));
    for (let y = 1; y < N - 1; y++)
      for (let x = 1; x < N - 1; x++) {
        if (!mask[y][x]) {
          nu[y][x] = u[y][x];
          continue;
        }
        // guidance: Laplacian of src
        const lapS =
          4 * src[y][x] - src[y - 1][x] - src[y + 1][x] - src[y][x - 1] - src[y][x + 1];
        // Jacobi update for Poisson: u = avg(neigh) - lapS/4
        const avg = 0.25 * (u[y - 1][x] + u[y + 1][x] + u[y][x - 1] + u[y][x + 1]);
        nu[y][x] = avg - lapS / 4;
      }
    // keep boundary fixed to dst
    for (let y = 0; y < N; y++) {
      nu[y][0] = dst[y][0];
      nu[y][N - 1] = dst[y][N - 1];
    }
    for (let x = 0; x < N; x++) {
      nu[0][x] = dst[0][x];
      nu[N - 1][x] = dst[N - 1][x];
    }
    // outside mask = dst
    for (let y = 1; y < N - 1; y++)
      for (let x = 1; x < N - 1; x++) if (!mask[y][x]) nu[y][x] = dst[y][x];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) u[y][x] = nu[y][x];
  }
  return u;
}
function drawField(ctx, A) {
  const N = A.length;
  const img = ctx.createImageData(N, N);
  let mn = Infinity,
    mx = -Infinity;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      mn = Math.min(mn, A[y][x]);
      mx = Math.max(mx, A[y][x]);
    }
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const t = (A[y][x] - mn) / (mx - mn + 1e-9);
      const off = 4 * (y * N + x);
      const R = Math.floor(40 + 200 * t),
        G = Math.floor(50 + 180 * (1 - t)),
        B = Math.floor(220 * (1 - t));
      img.data[off] = R;
      img.data[off + 1] = G;
      img.data[off + 2] = B;
      img.data[off + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
}

export default function PoissonBlendLab() {
  const [N, setN] = useState(160);
  const [iters, setIters] = useState(700);
  const { src, dst } = useMemo(() => makePatterns(N), [N]);
  const mask = useMemo(() => circleMask(N), [N]);
  const blend = useMemo(() => blendPoisson(src, dst, mask, iters), [src, dst, mask, iters]);

  const cnvS = useRef(null),
    cnvD = useRef(null),
    cnvB = useRef(null);
  useEffect(() => {
    const cs = cnvS.current,
      cd = cnvD.current,
      cb = cnvB.current;
    if (!cs || !cd || !cb) return;
    cs.width = cd.width = cb.width = N;
    cs.height = cd.height = cb.height = N;
    drawField(cs.getContext("2d", { alpha: false }), src);
    drawField(cd.getContext("2d", { alpha: false }), dst);
    drawField(cb.getContext("2d", { alpha: false }), blend);
  }, [src, dst, blend, N]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Poisson Image Blend — Seamless Clone (toy)</h2>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <Panel title="Source">
          <canvas ref={cnvS} style={{ width: "100%", imageRendering: "pixelated" }} />
        </Panel>
        <Panel title="Target">
          <canvas ref={cnvD} style={{ width: "100%", imageRendering: "pixelated" }} />
        </Panel>
        <Panel title="Blended">
          <canvas ref={cnvB} style={{ width: "100%", imageRendering: "pixelated" }} />
        </Panel>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1fr 320px", gap: 16 }}>
        <div />
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="grid N" v={N} set={setN} min={96} max={224} step={16} />
          <Slider label="iterations" v={iters} set={setIters} min={200} max={2000} step={50} />
          <ActiveReflection
            title="Active Reflection — Poisson Blend"
            storageKey="reflect_poisson_blend"
            prompts={[
              "Raise iterations: seams fade first near which features?",
              "Why does copying Laplacian (gradients) transfer structure smoothly?",
              "How would a user-defined mask change the result?",
            ]}
          />
        </section>
      </div>
    </div>
  );
}
function Panel({ title, children }) {
  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <h3 className="font-semibold mb-2">{title}</h3>
      {children}
    </section>
  );
}
function Slider({ label, v, set, min, max, step }) {
  const show = typeof v === "number" && v.toFixed ? v.toFixed(0) : v;
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

