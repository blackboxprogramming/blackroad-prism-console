import { useEffect, useRef, useState } from 'react';

/** f(z)=z^3 - 1  → roots: 1,  (-1±i√3)/2  */
function f(z) {
  return {
    re: z.re * z.re * z.re - 1,
    im: 3 * z.re * z.re * z.im - 3 * z.re * z.im * z.im,
  };
} // not separating re/im nicely—let's write helpers
function fc(z) {
  const a = z.re,
    b = z.im;
  return { re: a * a * a - 3 * a * b * b - 1, im: 3 * a * a * b - b * b * b };
} // z^3 - 1
function dfc(z) {
  const a = z.re,
    b = z.im; // derivative 3z^2
  return { re: 3 * (a * a - b * b), im: 6 * a * b };
}
function sub(a, b) {
  return { re: a.re - b.re, im: a.im - b.im };
}
function add(a, b) {
  return { re: a.re + b.re, im: a.im + b.im };
}
function mul(a, b) {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}
function div(a, b) {
  const d = b.re * b.re + b.im * b.im || 1e-12;
  return {
    re: (a.re * b.re + a.im * b.im) / d,
    im: (a.im * b.re - a.re * b.im) / d,
  };
}
function abs2(z) {
  return z.re * z.re + z.im * z.im;
}

const ROOTS = [
  { re: 1, im: 0 },
  { re: -0.5, im: Math.sqrt(3) / 2 },
  { re: -0.5, im: -Math.sqrt(3) / 2 },
];

export default function NewtonFractalLab() {
  const canvasRef = useRef(null);
  const [centerX, setCX] = useState(0),
    [centerY, setCY] = useState(0);
  const [scale, setScale] = useState(2.2); // half-width of view
  const [iters, setIters] = useState(40);
  const [w, h] = [640, 480];

  useEffect(() => {
    const cnv = canvasRef.current;
    if (!cnv) return;
    cnv.width = w;
    cnv.height = h;
    const ctx = cnv.getContext('2d', { alpha: false });
    const img = ctx.createImageData(w, h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // map pixel to complex plane
        const zx = centerX + (x / w - 0.5) * 2 * scale;
        const zy = centerY + ((y / h - 0.5) * 2 * scale * h) / w; // keep aspect
        let z = { re: zx, im: zy };
        let k = 0;
        for (; k < iters; k++) {
          const fz = fc(z);
          const dfz = dfc(z);
          const step = div(fz, dfz);
          z = sub(z, step);
          if (abs2(step) < 1e-12) break;
        }
        // find nearest root
        let idx = 0,
          mind = abs2(sub(z, ROOTS[0]));
        for (let j = 1; j < ROOTS.length; j++) {
          const d = abs2(sub(z, ROOTS[j]));
          if (d < mind) {
            mind = d;
            idx = j;
          }
        }
        // color by root and speed (k)
        const t = k / iters;
        const base = [
          [255, 120, 120],
          [120, 255, 160],
          [120, 170, 255],
        ][idx];
        const r = Math.floor(base[0] * Math.pow(1 - t, 0.6));
        const g = Math.floor(base[1] * Math.pow(1 - t, 0.6));
        const b = Math.floor(base[2] * Math.pow(1 - t, 0.6));

        const off = 4 * (y * w + x);
        img.data[off + 0] = r;
        img.data[off + 1] = g;
        img.data[off + 2] = b;
        img.data[off + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [centerX, centerY, scale, iters, w, h]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Newton Fractal — f(z)=z³−1</h2>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', maxWidth: w, height: h }}
      />
      <div
        className="grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
          gap: 16,
        }}
      >
        <Panel title="View">
          <Slider
            label="center x"
            v={centerX}
            set={setCX}
            min={-2.0}
            max={2.0}
            step={0.01}
          />
          <Slider
            label="center y"
            v={centerY}
            set={setCY}
            min={-2.0}
            max={2.0}
            step={0.01}
          />
          <Slider
            label="scale (zoom)"
            v={scale}
            set={setScale}
            min={0.3}
            max={3.0}
            step={0.01}
          />
        </Panel>
        <Panel title="Iteration">
          <Slider
            label="iterations"
            v={iters}
            set={setIters}
            min={10}
            max={80}
            step={1}
          />
          <p className="text-xs opacity-80 mt-2">
            Colors: which root you converge to. Brightness: speed.
          </p>
        </Panel>
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
