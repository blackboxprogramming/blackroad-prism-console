import { useMemo } from 'react';

function fallbackGrid(size = 16) {
  const values = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      values.push(Math.sin((x / size) * Math.PI) * Math.cos((y / size) * Math.PI));
    }
  }
  return { width: size, height: size, values };
}

export default function PhaseFieldView({ job }) {
  const grid = useMemo(() => fallbackGrid(), [job?.id]);
  return (
    <div className="grid grid-cols-16 gap-[1px] bg-slate-700 p-2 rounded-lg">
      {grid.values.map((value, idx) => {
        const intensity = Math.round(((value + 1) / 2) * 255);
        return <div key={idx} className="h-3 w-3" style={{ backgroundColor: `rgb(${intensity}, ${128 - intensity / 2}, ${255 - intensity})` }} />;
      })}
    </div>
function tile(values, width) {
  return values.reduce((rows, value, index) => {
    if (index % width === 0) rows.push([]);
    rows[rows.length - 1].push(value);
    return rows;
  }, []);
}

export default function PhaseFieldView({ state }) {
  const residuals = state?.metrics?.residuals ?? state?.residuals;
  const frames = state?.frames;
  if (!residuals) {
    return (
      <section className="rounded-xl border border-white/10 bg-black/30 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide opacity-70">Cahn–Hilliard Phase</h3>
        <p className="mt-2 text-xs opacity-60">Run the phase-field solver to capture residual trends.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-white/10 bg-black/30 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide opacity-70">Cahn–Hilliard Phase</h3>
      <div className="mt-3">
        <div className="text-xs font-semibold uppercase opacity-60">Residuals</div>
        <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-mono">
          {residuals.slice(0, 12).map((value, idx) => (
            <span key={idx} className="rounded bg-white/10 px-2 py-1">
              step {idx}: {Number(value).toExponential(2)}
            </span>
          ))}
        </div>
      </div>
      {frames?.length ? (
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase opacity-60">First frame</div>
          <div className="mt-2 space-y-1 text-[10px] font-mono">
            {tile(frames[0].values, frames[0].width).map((row, idx) => (
              <div key={idx}>{row.map((value) => value.toFixed(2)).join(" ")}</div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
