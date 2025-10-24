import React, { useMemo, useState } from 'react';

export default function TrajectoryView({ trajectory }) {
  const [index, setIndex] = useState(0);
  const current = trajectory.samples[index] ?? trajectory.samples[0];

  const points = useMemo(() => {
    if (!trajectory.samples.length) return '';
    const xs = trajectory.samples.map((sample) => sample.state[0]);
    const ys = trajectory.samples.map((sample) => sample.state[1] ?? 0);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    return trajectory.samples
      .map((sample) => {
        const normX = ((sample.state[0] - minX) / spanX) * 100;
        const normY = 100 - ((sample.state[1] ?? 0 - minY) / spanY) * 100;
        return `${normX.toFixed(2)},${normY.toFixed(2)}`;
      })
      .join(' ');
  }, [trajectory.samples]);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Trajectory Player</h3>
        <span className="text-xs text-slate-500">t = {current?.time.toFixed(2) ?? '0.00'}s</span>
      </div>
      <svg viewBox="0 0 100 100" className="h-48 w-full rounded border border-slate-200 bg-slate-50">
        <polyline points={points} fill="none" stroke="rgb(30,64,175)" strokeWidth="1.5" strokeLinecap="round" />
        {current ? (
          <circle
            cx={((current.state[0] - trajectory.samples[0].state[0]) / ((Math.max(...trajectory.samples.map((sample) => sample.state[0])) - Math.min(...trajectory.samples.map((sample) => sample.state[0]))) || 1)) * 100}
            cy={
              100 -
              (((current.state[1] ?? 0) - Math.min(...trajectory.samples.map((sample) => sample.state[1] ?? 0))) /
                ((Math.max(...trajectory.samples.map((sample) => sample.state[1] ?? 0)) -
                  Math.min(...trajectory.samples.map((sample) => sample.state[1] ?? 0))) || 1)) *
                100
            }
            r="2"
            fill="rgb(30,64,175)"
          />
        ) : null}
      </svg>
      <input
        type="range"
        min={0}
        max={Math.max(trajectory.samples.length - 1, 0)}
        value={index}
        onChange={(event) => setIndex(Number(event.target.value))}
      />
      {current ? (
        <dl className="grid grid-cols-2 gap-2 text-xs text-slate-600">
          <div>
            <dt className="font-semibold">State</dt>
            <dd>
              [{current.state.map((value) => value.toFixed(2)).join(', ')}]
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Control</dt>
            <dd>
              [{current.control.map((value) => value.toFixed(2)).join(', ')}]
            </dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
