import { useEffect, useState } from 'react';

export default function Timeline({ frames = [], current = 0, onChange }) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return undefined;
    const handle = setInterval(() => {
      onChange((prev) => {
        const next = (typeof prev === 'number' ? prev : current) + 1;
        if (next >= frames.length) {
          setPlaying(false);
          return frames.length - 1;
        }
        return next;
      });
    }, 200);
    return () => clearInterval(handle);
  }, [playing, frames.length, onChange, current]);

  if (!frames.length) {
    return (
      <div className="flex h-24 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400">
        No frames loaded yet
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded bg-slate-800 px-3 py-1 text-sm font-semibold text-slate-100 hover:bg-slate-700"
          onClick={() => setPlaying((prev) => !prev)}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <span className="text-xs uppercase tracking-widest text-slate-400">
          Frame {current + 1} / {frames.length}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={frames.length - 1}
        value={current}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-4 w-full"
      />
    </div>
  );
}
