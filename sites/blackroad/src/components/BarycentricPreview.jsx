import { useEffect, useRef } from "react";

function normalize(value, min, max) {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

export default function BarycentricPreview({ map }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!map || map.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rows = map.length;
    const cols = map[0].length;
    canvas.width = cols;
    canvas.height = rows;
    let min = Infinity;
    let max = -Infinity;
    for (const row of map) {
      for (const value of row) {
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    }
    const image = ctx.createImageData(cols, rows);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const value = normalize(map[y][x], min, max);
        const idx = (y * cols + x) * 4;
        const tint = Math.floor(255 * value);
        image.data[idx] = tint;
        image.data[idx + 1] = 120 + Math.floor(100 * value);
        image.data[idx + 2] = 255 - tint;
        image.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }, [map]);

  return (
    <section className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-2">
      <header className="flex items-center justify-between">
        <h3 className="font-semibold">Barycentric map</h3>
        <span className="text-xs opacity-70">normalised heatmap</span>
      </header>
      <div className="bg-black/30 border border-white/10 rounded overflow-hidden" style={{ aspectRatio: "1 / 1" }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
      </div>
    </section>
  );
}
