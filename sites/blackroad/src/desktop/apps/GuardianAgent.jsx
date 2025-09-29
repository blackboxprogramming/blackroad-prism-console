import { useEffect, useState } from "react";
import AgentModeToggle from "../AgentModeToggle.jsx";

const CHECKS = [
  { id: "policy", label: "Policy drift", detail: "Compare live config vs. baseline" },
  { id: "secrets", label: "Secrets hygiene", detail: "Scan for leaked credentials" },
  { id: "access", label: "Access control", detail: "Verify role boundaries" },
  { id: "telemetry", label: "Telemetry", detail: "Ensure audit events are flowing" },
];

export default function GuardianAgent() {
  const [mode, setMode] = useState("copilot");
  const [flags, setFlags] = useState([]);
  const [lastRun, setLastRun] = useState(null);

  const runScan = () => {
    const timestamp = new Date();
    setLastRun(timestamp.toLocaleTimeString());
    const flagged = CHECKS.filter(() => Math.random() > 0.5).map((check) => ({
      id: check.id,
      summary: `${check.label} requires attention`,
      mitigation: `Loop agent on ${check.detail.toLowerCase()}.`,
    }));
    setFlags(flagged);
  };

  useEffect(() => {
    if (mode !== "autonomous") return;
    runScan();
    const id = globalThis.setInterval?.(runScan, 20000);
    return () => {
      if (id && typeof globalThis.clearInterval === "function") {
        globalThis.clearInterval(id);
      }
    };
  }, [mode]);

  return (
    <div className="h-full flex flex-col bg-neutral-950 text-neutral-100">
      <header className="flex flex-col gap-2 border-b border-neutral-900 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Guardian Agent</p>
            <p className="text-xs text-neutral-400">
              {lastRun ? `Last scan ${lastRun}` : "Standing by for contradictions."}
            </p>
          </div>
          <AgentModeToggle mode={mode} onChange={setMode} />
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-neutral-300">
          {CHECKS.map((check) => (
            <span key={check.id} className="rounded border border-neutral-800 bg-neutral-900/50 px-2 py-1">
              {check.label}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={runScan}
          className="self-start rounded bg-emerald-500/20 px-3 py-1 text-sm text-emerald-200 hover:bg-emerald-500/30"
        >
          Run guardian scan
        </button>
      </header>

      <section className="flex-1 overflow-auto p-3 space-y-3">
        {flags.length === 0 ? (
          <div className="rounded border border-neutral-800 bg-neutral-900/40 px-3 py-2 text-sm text-neutral-400">
            All clear. Guardian agent will surface contradictions as soon as they appear.
          </div>
        ) : (
          flags.map((flag) => (
            <article
              key={flag.id}
              className="rounded border border-rose-700/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wide text-rose-200">{flag.summary}</h3>
              <p className="text-xs text-rose-100/80">{flag.mitigation}</p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
