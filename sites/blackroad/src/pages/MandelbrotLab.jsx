import { useEffect, useRef, useState } from 'react';
import ActiveReflection from './ActiveReflection.jsx';

/** Smooth escape coloring for c in C, z_{n+1}=z_n^2+c, z_0=0 */
function drawMandelbrot(ctx, W, H, centerX, centerY, scale, iters, power = 2) {
  const img = ctx.createImageData(W, H);
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const x0 = centerX + (px / W - 0.5) * 2 * scale;
      const y0 = centerY + (py / H - 0.5) * 2 * scale * (H / W);
      let zx = 0,
        zy = 0,
        dx = 0,
        dy = 0; // track derivative dz/dc
      let k = 0;
      for (; k < iters; k++) {
        // z^2 + c with derivative: z'_{n+1} = 2 z_n z'_n + 1
        const zx2 = zx * zx - zy * zy + x0;
        const zy2 = 2 * zx * zy + y0;
        const ndx = 2 * (zx * dx - zy * dy) + 1;
        const ndy = 2 * (zx * dy + zy * dx);
        zx = zx2;
        zy = zy2;
        dx = ndx;
        dy = ndy;
        if (zx * zx + zy * zy > 256) break;
      }
      let r = 0,
        g = 0,
        b = 0;
      if (k === iters) {
        r = g = b = 0; // inside (likely)
      } else {
        // smooth mu = k + 1 - log log |z| / log 2
        const mod = Math.sqrt(zx * zx + zy * zy);
        const mu = k + 1 - Math.log(Math.log(mod)) / Math.log(2);
        // color palette via trig
        const t = 0.015 * mu;
        r = Math.floor(180 + 75 * Math.sin(t));
        g = Math.floor(180 + 75 * Math.sin(t + 2.094));
        b = Math.floor(180 + 75 * Math.sin(t + 4.188));
        // derivative glow: large |dz/dc| → brighter
        const d = Math.hypot(dx, dy);
        const glow = Math.min(1, Math.log10(d + 1) / 3);
        r = Math.min(255, Math.floor(r * (0.8 + 0.2 * glow)));
        g = Math.min(255, Math.floor(g * (0.8 + 0.2 * glow)));
        b = Math.min(255, Math.floor(b * (0.8 + 0.2 * glow)));
      }
      const off = 4 * (py * W + px);
      img.data[off + 0] = r;
      img.data[off + 1] = g;
      img.data[off + 2] = b;
      img.data[off + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

export default function MandelbrotLab() {
  const cnv = useRef(null);
  const [cx, setCX] = useState(-0.5),
    [cy, setCY] = useState(0.0);
  const [scale, setScale] = useState(1.8);
  const [iters, setIters] = useState(200);
  const W = 640,
    H = 480;
  useEffect(() => {
    const c = cnv.current;
    if (!c) return;
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d', { alpha: false });
    drawMandelbrot(ctx, W, H, cx, cy, scale, iters);
  }, [cx, cy, scale, iters]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">
        Mandelbrot Explorer — smooth escape + derivative glow
      </h2>
      <canvas ref={cnv} style={{ width: '100%', maxWidth: W, height: H }} />
      <div
        className="grid"
        style={{ gridTemplateColumns: '1fr 320px', gap: 16 }}
      >
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider
            label="center x"
            v={cx}
            set={setCX}
            min={-2.0}
            max={1.0}
            step={0.001}
          />
          <Slider
            label="center y"
            v={cy}
            set={setCY}
            min={-1.5}
            max={1.5}
            step={0.001}
          />
          <Slider
            label="scale"
            v={scale}
            set={setScale}
            min={0.1}
            max={2.8}
            step={0.001}
          />
          <Slider
            label="iterations"
            v={iters}
            set={setIters}
            min={50}
            max={800}
            step={10}
          />
        </section>
        <ActiveReflection
          title="Active Reflection — Mandelbrot"
          storageKey="reflect_mandel"
          prompts={[
            'Zoom near the seahorse valley (~ -0.75+0.1i): what fine structure do you see?',
            'Increase iterations: which details stabilize first? Which require deeper k?',
            'Find a minibrot: how does the cardioid/period-bulb anatomy repeat?',
          ]}
        />
      </div>
    </div>
  );
}
function Slider({ label, v, set, min, max, step }) {
  const show = typeof v === 'number' && v.toFixed ? v.toFixed(4) : v;
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
