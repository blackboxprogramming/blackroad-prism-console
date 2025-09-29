import { useEffect, useMemo, useRef, useState } from "react";
import AgentModeToggle from "../AgentModeToggle.jsx";

const ENDPOINTS = [
  { method: "GET", path: "/api/health", description: "Service heartbeat and metadata" },
  { method: "GET", path: "/api/projects", description: "List active Prism projects" },
  { method: "POST", path: "/api/jobs", description: "Schedule a background orchestration" },
  { method: "GET", path: "/api/agents", description: "Enumerate registered copilots" },
];

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function ApiAgent() {
  const [mode, setMode] = useState("copilot");
  const [status, setStatus] = useState({ state: "idle", ok: null, info: "" });
  const [logs, setLogs] = useState(() => []);
  const timerRef = useRef(null);

  const ping = async () => {
    setStatus({ state: "probing", ok: null, info: "Contacting /api/health" });
    const stamp = Date.now();
    try {
      const fetcher = globalThis.fetch;
      if (typeof fetcher !== "function") {
        throw new Error("fetch unavailable");
      }
      const response = await fetcher("/api/health", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      const ok = response.ok;
      const info = payload.time || formatTime(stamp);
      setStatus({ state: "complete", ok, info });
      setLogs((entries) => [
        `${formatTime(stamp)} — ${ok ? "Health probe succeeded" : "Health probe failed"}`,
        ...entries,
      ].slice(0, 12));
    } catch (error) {
      setStatus({ state: "complete", ok: false, info: "network error" });
      setLogs((entries) => [
        `${formatTime(Date.now())} — Network error: ${error.message}`,
        ...entries,
      ].slice(0, 12));
    }
  };

  useEffect(() => {
    if (mode !== "autonomous") return;
    ping();
    timerRef.current = globalThis.setInterval ? globalThis.setInterval(ping, 15000) : null;
    return () => {
      if (timerRef.current && typeof globalThis.clearInterval === "function") {
        globalThis.clearInterval(timerRef.current);
      }
      timerRef.current = null;
    };
  }, [mode]);

  const statusTone = useMemo(() => {
    if (status.state === "idle") return "text-neutral-300";
    if (status.state === "probing") return "text-amber-300";
    return status.ok ? "text-emerald-300" : "text-rose-300";
  }, [status]);

  return (
    <div className="h-full flex flex-col bg-neutral-950 text-neutral-100">
      <header className="flex flex-col gap-2 border-b border-neutral-800 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">API Agent</p>
            <p className={`text-xs ${statusTone}`}>
              {status.state === "idle" && "Standing by"}
              {status.state === "probing" && "Running health probe…"}
              {status.state === "complete" &&
                (status.ok ? `Healthy • ${status.info}` : `Issue detected • ${status.info}`)}
            </p>
          </div>
          <AgentModeToggle mode={mode} onChange={setMode} />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={ping}
            className="rounded bg-emerald-500/20 px-3 py-1 text-emerald-200 hover:bg-emerald-500/30"
          >
            Run health probe
          </button>
          <span className="text-neutral-400">
            {mode === "manual" && "Manual investigations only."}
            {mode === "copilot" && "Assisted debugging with analyst context."}
            {mode === "autonomous" && "Auto-scanning every 15 seconds."}
          </span>
        </div>
      </header>

      <div className="grid grid-rows-[1fr_auto] gap-3 p-3 flex-1 min-h-0">
        <section className="rounded border border-neutral-800 bg-neutral-900/40 p-3 overflow-auto">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">Recent activity</h3>
          {logs.length === 0 ? (
            <p className="text-sm text-neutral-400">No probes yet. Trigger a health check to populate telemetry.</p>
          ) : (
            <ul className="space-y-1 text-sm font-mono">
              {logs.map((line, index) => (
                <li key={`${line}-${index}`} className="whitespace-pre-wrap">
                  {line}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded border border-neutral-800 bg-neutral-900/40 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">Surface map</h3>
          <div className="space-y-1 text-xs">
            {ENDPOINTS.map((endpoint) => (
              <div
                key={endpoint.path}
                className="flex items-start justify-between gap-3 rounded bg-neutral-950/60 px-2 py-1"
              >
                <div>
                  <span className="font-semibold text-emerald-200">{endpoint.method}</span>{" "}
                  <code className="font-mono text-neutral-200">{endpoint.path}</code>
                  <p className="text-[11px] text-neutral-400">{endpoint.description}</p>
                </div>
                <span className="rounded bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-300">
                  {mode === "autonomous" ? "watching" : "ready"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
