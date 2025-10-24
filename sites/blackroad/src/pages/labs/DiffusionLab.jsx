import { useMemo, useState } from 'react';
import ArtifactViewer from '@/components/ArtifactViewer';
import ChatPanel from '@/components/ChatPanel';
import FieldView from '@/components/Diffusion/FieldView';
import Timeline from '@/components/Diffusion/Timeline';

function gaussian(x, y, mx, my, sigma) {
  const dx = x - mx;
  const dy = y - my;
  return Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
}

function synthesizeFrames(count, width, height) {
  const frames = [];
  for (let step = 0; step < count; step++) {
    const tau = step / Math.max(count - 1, 1);
    const mix = 0.5 + 0.5 * Math.sin(tau * Math.PI * 2);
    const data = new Array(width * height);
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        const x = (i / width) * 4 - 2;
        const y = (j / height) * 4 - 2;
        const g1 = gaussian(x, y, -1, 0, 0.6);
        const g2 = gaussian(x, y, 1, 0, 0.6);
        data[j * width + i] = mix * g1 + (1 - mix) * g2;
      }
    }
    frames.push(data);
  }
  return frames;
}

export default function DiffusionLabPage() {
  const [jobId, setJobId] = useState(null);
  const [frames, setFrames] = useState([]);
  const [grid, setGrid] = useState(null);
  const [current, setCurrent] = useState(0);

  const metrics = useMemo(() => {
    if (!frames.length) return null;
    const klTrend = frames.map((frame, index) => ({
      step: index,
      peak: Math.max(...frame)
    }));
    return klTrend;
  }, [frames]);

  const handleGenerate = () => {
    const generated = synthesizeFrames(40, 96, 96);
    setFrames(generated);
    setGrid({ width: 96, height: 96 });
    setCurrent(0);
    setJobId(`diffusion-demo-${Date.now()}`);
  };

  return (
    <div className="grid min-h-screen grid-cols-[360px_1fr_360px] gap-8 bg-slate-950 p-8 text-white">
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold text-slate-100">Diffusion presets</h2>
          <p className="mt-2 text-sm text-slate-400">
            Use the demo generator to synthesise a small double-well sequence. Integrations with the CLI and GraphQL gateway
            stream into this panel in production.
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            className="mt-4 w-full rounded bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400"
          >
            Generate sample run
          </button>
          {metrics && (
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Sample metrics</h3>
              <div className="max-h-40 overflow-y-auto rounded border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
                {metrics.map((entry) => (
                  <div key={entry.step} className="flex justify-between py-1">
                    <span>Step {entry.step.toString().padStart(3, '0')}</span>
                    <span>Peak density {entry.peak.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <ArtifactViewer jobId={jobId} />
      </div>
      <div className="space-y-6 overflow-y-auto">
        <FieldView frame={frames[current]} grid={grid} />
        <Timeline frames={frames} current={current} onChange={setCurrent} />
      </div>
      <ChatPanel jobId={jobId} />
    </div>
  );
}
