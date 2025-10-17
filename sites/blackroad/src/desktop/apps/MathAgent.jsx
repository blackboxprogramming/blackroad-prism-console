import { useEffect, useMemo, useState } from "react";
import AgentModeToggle from "../AgentModeToggle.jsx";

function normalizeExpression(expression) {
  return expression.replace(/y/g, "x");
}

function evaluateExpression(expression, domain) {
  const fn = new Function("x", `return (${expression});`);
  const values = [];
  for (let x = domain.start; x <= domain.end; x += domain.step) {
    let result;
    try {
      result = fn(Number(x.toFixed(5)));
    } catch (error) {
      result = `error: ${error.message}`;
    }
    values.push({ x: Number(x.toFixed(2)), y: result });
  }
  return values;
}

const PRESETS = [
  { label: "Sine wave", expression: "Math.sin(x).toFixed(3)", domain: { start: 0, end: Math.PI * 2, step: 0.4 } },
  { label: "Logistic map", expression: "3.6 * y * (1 - y)", domain: { start: 0, end: 1, step: 0.1 } },
  { label: "Quadratic", expression: "(x*x - 4*x + 3).toFixed(2)", domain: { start: -2, end: 6, step: 0.5 } },
];

export default function MathAgent() {
  const [mode, setMode] = useState("copilot");
  const [expression, setExpression] = useState("Math.sin(x)");
  const [domain, setDomain] = useState({ start: 0, end: 6.28, step: 0.5 });
  const [series, setSeries] = useState(() => evaluateExpression("Math.sin(x)", { start: 0, end: 6.28, step: 0.5 }));
  const [status, setStatus] = useState("Ready to compute trajectories.");

  const compute = () => {
    setStatus("Crunching numbers…");
    try {
      const results = evaluateExpression(expression, domain);
      setSeries(results);
      setStatus(`Evaluated ${results.length} points.`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  useEffect(() => {
    if (mode !== "autonomous") return;
    const id = globalThis.setInterval?.(() => {
      setStatus("Auto-sampling new values…");
      setSeries((previous) => {
        if (previous.length === 0) return previous;
        const rotated = [...previous.slice(1), previous[0]];
        return rotated;
      });
    }, 4000);
    return () => {
      if (id && typeof globalThis.clearInterval === "function") {
        globalThis.clearInterval(id);
      }
    };
  }, [mode]);

  const preview = useMemo(() => series.slice(0, 12), [series]);

  return (
    <div className="h-full flex flex-col bg-neutral-950 text-neutral-100">
      <header className="flex flex-col gap-2 border-b border-neutral-900 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Math Agent</p>
            <p className="text-xs text-neutral-400">{status}</p>
          </div>
          <AgentModeToggle mode={mode} onChange={setMode} />
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {PRESETS.map((preset) => {
            const normalizedExpression = normalizeExpression(preset.expression);
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setExpression(normalizedExpression);
                  setDomain(preset.domain);
                  setSeries(evaluateExpression(normalizedExpression, preset.domain));
                }}
                className="rounded bg-neutral-800 px-2 py-1 text-neutral-200 hover:bg-neutral-700"
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="grid flex-1 min-h-0 grid-rows-[auto_auto_1fr] gap-3 p-3">
        <section className="rounded border border-neutral-800 bg-neutral-900/40 p-3 space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Expression</label>
          <textarea
            value={expression}
            onChange={(event) => setExpression(event.target.value)}
            className="h-16 w-full resize-none rounded border border-neutral-800 bg-neutral-950/60 p-2 font-mono text-sm text-neutral-100 focus:border-emerald-500/60 focus:outline-none"
          />
          <div className="grid grid-cols-3 gap-2 text-xs">
            <label className="flex flex-col gap-1">
              <span className="text-neutral-400">Start</span>
              <input
                type="number"
                value={domain.start}
                onChange={(event) => setDomain((d) => ({ ...d, start: Number(event.target.value) }))}
                className="rounded border border-neutral-800 bg-neutral-950/60 p-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-neutral-400">End</span>
              <input
                type="number"
                value={domain.end}
                onChange={(event) => setDomain((d) => ({ ...d, end: Number(event.target.value) }))}
                className="rounded border border-neutral-800 bg-neutral-950/60 p-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-neutral-400">Step</span>
              <input
                type="number"
                step="0.1"
                value={domain.step}
                onChange={(event) => setDomain((d) => ({ ...d, step: Number(event.target.value) }))}
                className="rounded border border-neutral-800 bg-neutral-950/60 p-2"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={compute}
            className="rounded bg-emerald-500/20 px-3 py-1 text-sm text-emerald-200 hover:bg-emerald-500/30"
          >
            Compute dataset
          </button>
        </section>

        <section className="rounded border border-neutral-800 bg-neutral-900/40 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">First samples</h3>
          <table className="w-full table-fixed text-xs text-neutral-300">
            <thead>
              <tr className="text-neutral-500">
                <th className="text-left font-semibold">x</th>
                <th className="text-left font-semibold">f(x)</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((point, index) => (
                <tr key={`${point.x}-${index}`} className="border-t border-neutral-900">
                  <td className="py-1 font-mono">{point.x}</td>
                  <td className="py-1 font-mono">{String(point.y)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded border border-neutral-800 bg-neutral-900/40 p-3 overflow-auto">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">Code export</h3>
          <pre className="text-[11px] font-mono leading-relaxed whitespace-pre">
{`const samples = ${JSON.stringify(series.slice(0, 24), null, 2)};`}
          </pre>
        </section>
      </div>
    </div>
  );
}
