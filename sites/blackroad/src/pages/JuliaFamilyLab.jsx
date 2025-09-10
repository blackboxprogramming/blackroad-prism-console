import { useEffect, useRef, useState } from 'react';
import ActiveReflection from './ActiveReflection.jsx';

function drawJulia(ctx, W, H, cx, cy, scale, iters, ca, cb) {
  const img = ctx.createImageData(W, H);
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      let zx = cx + (px / W - 0.5) * 2 * scale;
      let zy = cy + (py / H - 0.5) * 2 * scale * (H / W);
      let k = 0;
      for (; k < iters; k++) {
        const x2 = zx * zx - zy * zy + ca;
        const y2 = 2 * zx * zy + cb;
        zx = x2;
        zy = y2;
        if (zx * zx + zy * zy > 256) break;
      }
      let r = 0,
        g = 0,
        b = 0;
      if (k < iters) {
        const mod = Math.sqrt(zx * zx + zy * zy);
        const mu = k + 1 - Math.log(Math.log(mod)) / Math.log(2);
        const t = 0.02 * mu;
        r = Math.floor(180 + 75 * Math.sin(t));
        g = Math.floor(180 + 75 * Math.sin(t + 2.094));
        b = Math.floor(180 + 75 * Math.sin(t + 4.188));
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

export default function JuliaFamilyLab() {
  const cnv = useRef(null);
  const [cx, setCX] = useState(0),
    [cy, setCY] = useState(0);
  const [scale, setScale] = useState(1.6);
  const [iters, setIters] = useState(180);
  const [ca, setCA] = useState(-0.8),
    [cb, setCB] = useState(0.156);
  const W = 640,
    H = 480;

  useEffect(() => {
    const c = cnv.current;
    if (!c) return;
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d', { alpha: false });
    drawJulia(ctx, W, H, cx, cy, scale, iters, ca, cb);
  }, [cx, cy, scale, iters, ca, cb]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Julia Set Family — z² + c</h2>
      <canvas ref={cnv} style={{ width: '100%', maxWidth: W, height: H }} />
      <div
        className="grid"
        style={{ gridTemplateColumns: '1fr 320px', gap: 16 }}
      >
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider
            label="Re(c)"
            v={ca}
            set={setCA}
            min={-1.2}
            max={1.2}
            step={0.001}
          />
          <Slider
            label="Im(c)"
            v={cb}
            set={setCB}
            min={-1.2}
            max={1.2}
            step={0.001}
          />
          <Slider
            label="scale"
            v={scale}
            set={setScale}
            min={0.2}
            max={2.5}
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
          title="Active Reflection — Julia"
          storageKey="reflect_julia"
          prompts={[
            'Move c inside vs outside the Mandelbrot cardioid—how does connectivity change?',
            'Find dendrites vs Fatou dust: which c makes hair-like structures?',
            'What symmetries do you notice when Im(c) → -Im(c)?',
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
