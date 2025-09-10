import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function rk4_step(state, h) {
  // state = [{m, x:[x,y], v:[vx,vy]}, ...]
  const acc = (S) =>
    S.map((bi, i) => {
      let ax = 0,
        ay = 0;
      for (let j = 0; j < S.length; j++) {
        if (i === j) continue;
        const bj = S[j];
        const dx = bj.x[0] - bi.x[0],
          dy = bj.x[1] - bi.x[1];
        const r2 = dx * dx + dy * dy + 1e-6,
          r = Math.sqrt(r2);
        const f = bj.m / (r2 * r); // G=1
        ax += f * dx;
        ay += f * dy;
      }
      return [ax, ay];
    });
  const add = (A, B, s) =>
    A.map((b, i) => ({
      ...b,
      x: [b.x[0] + s * B[i].x[0], b.x[1] + s * B[i].x[1]],
      v: [b.v[0] + s * B[i].v[0], b.v[1] + s * B[i].v[1]],
    }));
  const der = (S) =>
    S.map((b, i) => ({ m: b.m, x: [b.v[0], b.v[1]], v: acc(S)[i] }));
  const k1 = der(state);
  const k2 = der(add(state, k1, h / 2));
  const k3 = der(add(state, k2, h / 2));
  const k4 = der(add(state, k3, h));
  return state.map((b, i) => ({
    m: b.m,
    x: [
      b.x[0] + (h / 6) * (k1[i].x[0] + 2 * k2[i].x[0] + 2 * k3[i].x[0] + k4[i].x[0]),
      b.x[1] + (h / 6) * (k1[i].x[1] + 2 * k2[i].x[1] + 2 * k3[i].x[1] + k4[i].x[1]),
    ],
    v: [
      b.v[0] + (h / 6) * (k1[i].v[0] + 2 * k2[i].v[0] + 2 * k3[i].v[0] + k4[i].v[0]),
      b.v[1] + (h / 6) * (k1[i].v[1] + 2 * k2[i].v[1] + 2 * k3[i].v[1] + k4[i].v[1]),
    ],
  }));
}

export default function NBodyLab() {
  const [mode, setMode] = useState("two"); // two or three
  const [h, setH] = useState(0.01);
  const [trail, setTrail] = useState(600);

  const init = useMemo(() => initState(mode), [mode]);
  const [state, setState] = useState(init);
  useEffect(() => setState(init), [init]);

  const cnv = useRef(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const c = cnv.current;
    if (!c) return;
    const ctx = c.getContext("2d", { alpha: false });
    const W = 640,
      H = 360;
    c.width = W;
    c.height = H;
    let raf;
    const S = []; // trails
    const loop = () => {
      // step a few times
      let st = state;
      for (let s = 0; s < 3; s++) st = rk4_step(st, h);
      setState(st);
      setTick((t) => t + 1);
      S.push(st.map((b) => [b.x[0], b.x[1]]));
      if (S.length > trail) S.shift();
      // render
      ctx.fillStyle = "rgb(10,12,18)";
      ctx.fillRect(0, 0, W, H);
      const scale = 70,
        cx = W / 2,
        cy = H / 2;
      // trails
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(200,220,255,0.5)";
      for (let i = 0; i < S.length - 1; i++) {
        const A = S[i],
          B = S[i + 1];
        for (let k = 0; k < st.length; k++) {
          ctx.beginPath();
          ctx.moveTo(cx + A[k][0] * scale, cy - A[k][1] * scale);
          ctx.lineTo(cx + B[k][0] * scale, cy - B[k][1] * scale);
          ctx.stroke();
        }
      }
      // bodies
      for (const b of st) {
        ctx.beginPath();
        ctx.arc(cx + b.x[0] * scale, cy - b.x[1] * scale, Math.max(2, 3 * Math.cbrt(b.m)), 0, Math.PI * 2);
        ctx.fillStyle = "rgb(220,240,255)";
        ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [state, h, trail, mode]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">N-Body Dance — Newtonian 2/3-body</h2>
      <canvas ref={cnv} style={{ width: "100%", imageRendering: "pixelated" }} />
      <div className="grid" style={{ gridTemplateColumns: "1fr 320px", gap: 16 }}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Radio name="mode" value={mode} set={setMode} opts={[["two", "two-body"], ["three", "three-body"]]} />
          <Slider label="step h" v={h} set={setH} min={0.002} max={0.03} step={0.001} />
          <Slider label="trail len" v={trail} set={setTrail} min={100} max={2000} step={50} />
          <button
            className="mt-2 px-3 py-1 rounded bg-white/10 border border-white/10"
            onClick={() => setState(initState(mode))}
          >
            Reset
          </button>
        </section>
        <ActiveReflection
          title="Active Reflection — N-Body"
          storageKey="reflect_nbody"
          prompts={[
            "Two-body: ellipses if v < escape; tweak h to control energy drift.",
            "Three-body: do you see transient choreographies?",
            "Why does shrinking h reduce but not eliminate drift with RK4?",
          ]}
        />
      </div>
    </div>
  );
}
function initState(mode) {
  if (mode === "two") {
    return [
      { m: 1.0, x: [-0.8, 0], v: [0, 0.6] },
      { m: 0.5, x: [0.6, 0], v: [0, -1.0] },
    ];
  }
  return [
    { m: 1.0, x: [-0.9, 0.0], v: [0.0, 0.7] },
    { m: 0.8, x: [0.6, 0.1], v: [0.0, -0.8] },
    { m: 0.3, x: [0.1, -0.8], v: [0.9, 0.0] },
  ];
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
function Radio({ name, value, set, opts }) {
  return (
    <div className="flex gap-3 text-sm">
      {opts.map(([val, lab]) => (
        <label key={val} className="flex items-center gap-1">
          <input type="radio" name={name} checked={value === val} onChange={() => set(val)} />
          {lab}
        </label>
      ))}
    </div>
  );
}

