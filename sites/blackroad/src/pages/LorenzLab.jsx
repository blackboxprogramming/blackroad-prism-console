import { useMemo, useState } from 'react';
import ActiveReflection from './ActiveReflection.jsx';

function rk4(f, y, h, p) {
  // y: [x,y,z]
  const k1 = f(y, p),
    k2 = f(
      y.map((v, i) => v + h * 0.5 * k1[i]),
      p
    );
  const k3 = f(
      y.map((v, i) => v + h * 0.5 * k2[i]),
      p
    ),
    k4 = f(
      y.map((v, i) => v + h * k3[i]),
      p
    );
  return y.map((v, i) => v + (h * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])) / 6);
}
function lorenz([x, y, z], [sigma, rho, beta]) {
  return [sigma * (y - x), x * (rho - z) - y, x * y - beta * z];
}

export default function LorenzLab() {
  const [sigma, setSigma] = useState(10),
    [rho, setRho] = useState(28),
    [beta, setBeta] = useState(8 / 3);
  const [h, setH] = useState(0.01),
    [steps, setSteps] = useState(8000);
  const [x0, setX0] = useState(0.01),
    [y0, setY0] = useState(0),
    [z0, setZ0] = useState(0);

  const path = useMemo(() => {
    let y = [x0, y0, z0];
    const p = [sigma, rho, beta];
    const pts = [];
    for (let k = 0; k < steps; k++) {
      y = rk4(lorenz, y, h, p);
      pts.push([...y]);
    }
    return pts;
  }, [sigma, rho, beta, h, steps, x0, y0, z0]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Lorenz Attractor — RK4</h2>
      <div
        className="grid"
        style={{ gridTemplateColumns: '1fr 320px', gap: 16 }}
      >
        <LorenzPlot pts={path} />
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider
            label="σ"
            v={sigma}
            set={setSigma}
            min={5}
            max={30}
            step={0.1}
          />
          <Slider label="ρ" v={rho} set={setRho} min={0} max={60} step={0.5} />
          <Slider
            label="β"
            v={beta}
            set={setBeta}
            min={0.5}
            max={4}
            step={0.01}
          />
          <Slider
            label="h (step)"
            v={h}
            set={setH}
            min={0.001}
            max={0.03}
            step={0.001}
          />
          <Slider
            label="steps"
            v={steps}
            set={setSteps}
            min={2000}
            max={20000}
            step={500}
          />
          <Slider label="x0" v={x0} set={setX0} min={-1} max={1} step={0.01} />
          <Slider label="y0" v={y0} set={setY0} min={-1} max={1} step={0.01} />
          <Slider label="z0" v={z0} set={setZ0} min={-1} max={1} step={0.01} />
          <ActiveReflection
            title="Active Reflection — Lorenz"
            storageKey="reflect_lorenz"
            prompts={[
              'Tiny changes in (x0,y0,z0): how fast do trajectories separate?',
              'Which projection (x–z vs x–y) makes the butterfly wings clearest?',
              'What happens as ρ crosses ~24–28? Does the orbit settle or wander?',
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function LorenzPlot({ pts }) {
  const W = 640,
    H = 360,
    pad = 14;
  // simple orthographic projection onto x–z plane
  const xs = pts.map((p) => p[0]),
    zs = pts.map((p) => p[2]);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs);
  const minZ = Math.min(...zs),
    maxZ = Math.max(...zs);
  const X = (x) => pad + ((x - minX) / (maxX - minX + 1e-9)) * (W - 2 * pad);
  const Z = (z) =>
    H - pad - ((z - minZ) / (maxZ - minZ + 1e-9)) * (H - 2 * pad);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <rect x="0" y="0" width={W} height={H} fill="none" />
      {pts.map((p, i) => {
        const x1 = i ? X(pts[i - 1][0]) : X(p[0]),
          z1 = i ? Z(pts[i - 1][2]) : Z(p[2]);
        const x2 = X(p[0]),
          z2 = Z(p[2]);
        return <line key={i} x1={x1} y1={z1} x2={x2} y2={z2} strokeWidth="1" />;
      })}
      <text x={pad} y={14} fontSize="10">
        Projection: (x,z)
      </text>
    </svg>
  );
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
