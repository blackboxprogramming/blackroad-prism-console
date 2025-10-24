import React, { useEffect, useMemo, useRef } from 'react';

function normalizeValue(value, min, max) {
  if (max <= min) return 0;
  return (value - min) / (max - min);
}

export default function QuiverView({ valueField, policyField, gridSize = { width: 20, height: 20 } }) {
  const canvasRef = useRef(null);

  const stats = useMemo(() => {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const row of valueField) {
      for (const entry of row) {
        if (entry < min) min = entry;
        if (entry > max) max = entry;
      }
    }
    return { min, max };
  }, [valueField]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const cellWidth = width / gridSize.width;
    const cellHeight = height / gridSize.height;

    for (let y = 0; y < gridSize.height; y += 1) {
      for (let x = 0; x < gridSize.width; x += 1) {
        const value = valueField[y]?.[x] ?? 0;
        const magnitude = normalizeValue(value, stats.min, stats.max);
        const hue = 220 - magnitude * 140;
        ctx.fillStyle = `hsl(${hue}, 80%, ${40 + magnitude * 30}%)`;
        ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth + 0.5, cellHeight + 0.5);
      }
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1;
    for (let y = 0; y < gridSize.height; y += 1) {
      for (let x = 0; x < gridSize.width; x += 1) {
        const vector = policyField[y]?.[x] ?? [0, 0];
        const centerX = x * cellWidth + cellWidth / 2;
        const centerY = y * cellHeight + cellHeight / 2;
        const scale = Math.min(cellWidth, cellHeight) * 0.35;
        const targetX = centerX + vector[0] * scale;
        const targetY = centerY - vector[1] * scale;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();

        const angle = Math.atan2(centerY - targetY, targetX - centerX);
        const headLength = Math.min(cellWidth, cellHeight) * 0.2;
        ctx.beginPath();
        ctx.moveTo(targetX, targetY);
        ctx.lineTo(targetX - headLength * Math.cos(angle - Math.PI / 6), targetY + headLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(targetX - headLength * Math.cos(angle + Math.PI / 6), targetY + headLength * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fill();
      }
    }
  }, [valueField, policyField, gridSize, stats.min, stats.max]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Field View</h3>
        <p className="text-xs text-slate-500">
          Value range {stats.min.toFixed(2)} → {stats.max.toFixed(2)}
        </p>
      </div>
      <canvas ref={canvasRef} width={480} height={360} className="w-full rounded border border-slate-200" />
    </div>
  );
}
