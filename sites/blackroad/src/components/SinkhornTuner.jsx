import { useMemo } from "react";

export default function SinkhornTuner({ config, onChange }) {
  const knobs = useMemo(() => ([
    { key: "epsilon", label: "ε (entropy)", min: 0.001, max: 1, step: 0.001 },
    { key: "iterations", label: "iterations", min: 50, max: 1200, step: 10 },
    { key: "tolerance", label: "tolerance", min: 1e-5, max: 1e-2, step: 1e-5 },
    { key: "cost", label: "cost", options: ["l2", "cosine", "tv_l1"] }
  ]), []);

  return (
    <section className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
      <h3 className="font-semibold">Sinkhorn Controls</h3>
      {knobs.map((knob) => {
        if (knob.options) {
          return (
            <div key={knob.key} className="flex items-center justify-between text-sm">
              <span className="opacity-80">{knob.label}</span>
              <select
                className="bg-black/40 border border-white/10 rounded px-2 py-1"
                value={config[knob.key]}
                onChange={(event) => onChange({ ...config, [knob.key]: event.target.value })}
              >
                {knob.options.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        return (
          <div key={knob.key} className="text-sm">
            <div className="flex justify-between mb-1">
              <span className="opacity-80">{knob.label}</span>
              <span className="font-mono">{config[knob.key]}</span>
            </div>
            <input
              type="range"
              min={knob.min}
              max={knob.max}
              step={knob.step}
              value={config[knob.key]}
              onChange={(event) => onChange({ ...config, [knob.key]: parseFloat(event.target.value) })}
              className="w-full"
            />
          </div>
        );
      })}
    </section>
  );
}
