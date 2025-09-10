import { useMemo, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

/** Simple DWT (Haar or db2) on power-of-two length. */
const HAAR = { h: [1 / Math.SQRT2, 1 / Math.SQRT2], g: [1 / Math.SQRT2, -1 / Math.SQRT2] };
const DB2 = {
  h: [0.482962913145, 0.836516303738, 0.224143868042, -0.129409522551],
  g: [-0.129409522551, -0.224143868042, 0.836516303738, -0.482962913145],
};

function dwt1(x, filt, levels) {
  let a = x.slice(),
    coeffs = [];
  for (let L = 0; L < levels; L++) {
    const lo = [],
      hi = [];
    for (let i = 0; i < a.length; i += 2) {
      let s = 0,
        d = 0;
      for (let k = 0; k < filt.h.length; k++) {
        const j = (i + k) % a.length;
        s += filt.h[k] * a[j];
        d += filt.g[k] * a[j];
      }
      lo.push(s);
      hi.push(d);
    }
    coeffs.push(hi);
    a = lo;
  }
  coeffs.push(a); // last approx
  return coeffs; // [hi1, hi2, ..., approx]
}
function idwt1(coeffs, filt) {
  // inverse assuming orthonormal pairs
  let a = coeffs[coeffs.length - 1].slice();
  for (let L = coeffs.length - 2; L >= 0; L--) {
    const hi = coeffs[L],
      out = new Array((a.length + hi.length) * 2).fill(0);
    for (let i = 0; i < a.length; i++) {
      for (let k = 0; k < filt.h.length; k++) {
        const j = (2 * i + k) % out.length;
        out[j] += filt.h[k] * a[i];
        out[j] += filt.g[k] * hi[i];
      }
    }
    a = out;
  }
  return a;
}

function synthSignal(N) {
  const x = [];
  for (let n = 0; n < N; n++) {
    const t = n / N;
    x.push(
      0.6 * Math.sin(6 * Math.PI * t) +
        0.3 * Math.sin(20 * Math.PI * t) +
        0.15 * (t > 0.4 && t < 0.6 ? 1 : 0),
    );
  }
  return x;
}

export default function WaveletLab() {
  const [N, setN] = useState(256);
  const [levels, setLevels] = useState(4);
  const [basis, setBasis] = useState("haar");

  const x = useMemo(() => synthSignal(N), [N]);
  const filt = basis === "haar" ? HAAR : DB2;
  const coeffs = useMemo(() => dwt1(x, filt, levels), [x, levels, basis]);
  const rec = useMemo(() => idwt1(coeffs, filt), [coeffs, basis]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Wavelet 1-D Explorer — Haar / db2</h2>
      <Series title="Signal (x) & Reconstruction" a={x} b={rec} />
      <CoeffView coeffs={coeffs} />
      <div className="grid" style={{ gridTemplateColumns: "1fr 320px", gap: 16 }}>
        <div />
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Radio name="basis" value={basis} set={setBasis} opts={[["haar", "haar"], ["db2", "db2"]]} />
          <Slider label="levels" v={levels} set={setLevels} min={1} max={6} step={1} />
          <Slider label="N" v={N} set={setN} min={64} max={512} step={64} />
          <ActiveReflection
            title="Active Reflection — Wavelets"
            storageKey="reflect_wavelet"
            prompts={[
              "Switch Haar↔db2: how do details spread across scales?",
              "Which levels capture the step (0.4–0.6) vs the sines?",
              "Why does perfect reconstruction hold (up to float error)?",
            ]}
          />
        </section>
      </div>
    </div>
  );
}
function Series({ title, a, b }) {
  const W = 640,
    H = 200,
    pad = 10;
  const min = Math.min(...a, ...b),
    max = Math.max(...a, ...b);
  const X = (i) => pad + (i / (a.length - 1)) * (W - 2 * pad);
  const Y = (v) => H - pad - ((v - min) / (max - min + 1e-9)) * (H - 2 * pad);
  const poly = (arr) => arr.map((v, i) => `${X(i)},${Y(v)}`).join(" ");
  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <h3 className="font-semibold mb-2">{title}</h3>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        <polyline points={poly(a)} fill="none" strokeWidth="2" />
        <polyline points={poly(b)} fill="none" strokeWidth="2" opacity="0.6" />
      </svg>
    </section>
  );
}
function CoeffView({ coeffs }) {
  const H = 120,
    W = 640,
    pad = 10;
  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <h3 className="font-semibold mb-2">Detail Coefficients (levels 1..L) & Approx (bottom)</h3>
      {coeffs.map((c, idx) => {
        const a = c;
        const mn = Math.min(...a),
          mx = Math.max(...a);
        const X = (i) => pad + (i / (a.length - 1)) * (W - 2 * pad);
        const Y = (v) => H - pad - ((v - mn) / (mx - mn + 1e-9)) * (H - 2 * pad);
        return (
          <svg key={idx} width="100%" viewBox={`0 0 ${W} ${H}`} style={{ marginBottom: 8 }}>
            <polyline points={a.map((v, i) => `${X(i)},${Y(v)}`).join(" ")} fill="none" strokeWidth="2" />
            <text x={pad} y={12} fontSize="10">
              {idx < coeffs.length - 1 ? `detail L${idx + 1}` : `approx`}
            </text>
          </svg>
        );
      })}
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

