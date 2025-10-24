import { useEffect, useMemo, useRef } from 'react';

function normalise(values) {
  let min = Infinity;
  let max = -Infinity;
  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  const span = max - min || 1;
  return values.map((value) => (value - min) / span);
}

export default function FieldView({ frame, grid }) {
  const canvasRef = useRef(null);
  const imageData = useMemo(() => {
    if (!frame || !grid) return null;
    const normalised = normalise(frame);
    const pixels = new Uint8ClampedArray(grid.width * grid.height * 4);
    for (let i = 0; i < normalised.length; i++) {
      const value = Math.floor(normalised[i] * 255);
      pixels[i * 4] = value;
      pixels[i * 4 + 1] = 64;
      pixels[i * 4 + 2] = 255 - value;
      pixels[i * 4 + 3] = 255;
    }
    return { pixels, width: grid.width, height: grid.height };
  }, [frame, grid]);

  useEffect(() => {
    if (!imageData) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { pixels, width, height } = imageData;
    const image = new ImageData(pixels, width, height);
    canvas.width = width;
    canvas.height = height;
    ctx.putImageData(image, 0, 0);
  }, [imageData]);

  if (!frame || !grid) {
    return (
      <div className="flex h-80 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400">
        Select or generate a frame to render the field
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <canvas ref={canvasRef} className="w-full rounded" style={{ imageRendering: 'pixelated' }} />
      <p className="mt-3 text-sm text-slate-300">
        Density heatmap rendered from the current frame. Values are normalised per frame for clarity.
      </p>
    </div>
  );
}
