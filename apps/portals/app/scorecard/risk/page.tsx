"use client";

import { useEffect, useMemo, useState } from "react";
import { Topbar } from "../../../components/ui/topbar";
import { Card } from "../../../components/ui/card";

type RiskSystem = {
  key: string;
  name: string;
  risk: number;
  burn: number;
  findings: number;
  cost: number;
  color: "red" | "yellow" | "green";
  action: string;
  links?: {
    g?: string;
    s?: string;
    c?: string;
  };
};

type RiskPayload = {
  systems: RiskSystem[];
  updatedAt: string;
  stale?: boolean;
};

type FilterValue = "all" | "red" | "yellow" | "green";

type StatusMessage = {
  kind: "success" | "error";
  text: string;
};

function colorClass(color: RiskSystem["color"]) {
  switch (color) {
    case "red":
      return "border-rose-500/60 bg-rose-500/10";
    case "yellow":
      return "border-amber-500/60 bg-amber-500/10";
    default:
      return "border-emerald-500/60 bg-emerald-500/10";
  }
}

function metric(value: number) {
  if (Number.isNaN(value)) return "—";
  return value.toFixed(2);
}

export default function RiskHeatmapPage() {
  const [payload, setPayload] = useState<RiskPayload | null>(null);
  const [only, setOnly] = useState<FilterValue>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessage | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scorecard/risk", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }
      const body: RiskPayload = await res.json();
      setPayload(body);
    } catch (err) {
      console.error(err);
      setError("Unable to load risk scorecard right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const systems = useMemo(() => {
    if (!payload) return [] as RiskSystem[];
    const filtered = payload.systems.filter((system) => only === "all" || system.color === only);
    return filtered;
  }, [payload, only]);

  const exportCsv = () => {
    if (!systems.length) return;
    const rows = systems.map((system) =>
      [system.name, system.risk, system.burn, system.findings, system.cost, system.color, system.action.replace(/\n/g, " ")].join(","),
    );
    const csv = ["name,risk,burn,findings,cost,color,action", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `risk-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const subscribe = async () => {
    setMessage(null);
    try {
      const res = await fetch("/api/scorecard/risk/notify", { method: "POST" });
      if (!res.ok) {
        throw new Error(`Notify failed (${res.status})`);
      }
      setMessage({ kind: "success", text: "Digest sent to #exec." });
    } catch (err) {
      console.error(err);
      setMessage({ kind: "error", text: "Unable to send Slack digest." });
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar title="Risk Heatmap" />
      <main className="flex-1 space-y-6 bg-slate-950/80 px-4 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Risk Heatmap</h1>
            <p className="text-sm text-slate-400">Map reliability, security, and cost pressure by system.</p>
            {payload?.stale && (
              <span className="mt-2 inline-flex items-center rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
                Stale – showing last good CloudWatch snapshot
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={only}
              onChange={(event) => setOnly(event.target.value as FilterValue)}
              className="border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
            >
              <option value="all">All</option>
              <option value="red">Red</option>
              <option value="yellow">Yellow</option>
              <option value="green">Green</option>
            </select>
            <button
              type="button"
              onClick={exportCsv}
              className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-100 transition hover:bg-slate-700"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={subscribe}
              className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-100 transition hover:bg-slate-700"
            >
              Send to #exec
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`rounded border px-3 py-2 text-xs ${
              message.kind === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                : "border-rose-500/40 bg-rose-500/10 text-rose-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {error && (
          <div className="rounded border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>
        )}

        {loading && !error && <div className="text-sm text-slate-400">Loading…</div>}

        {!loading && !error && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {systems.map((system) => (
              <Card key={system.key} className={`border ${colorClass(system.color)} p-4 text-sm text-slate-100`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-base font-semibold text-white">{system.name}</div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">Risk {metric(system.risk)}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-xs text-slate-300">
                  <div title="Error-budget burn vs 99.9% SLO, last 24h">Burn {metric(system.burn)}</div>
                  <div title="Open critical/high issues normalized (0..2)">Find {metric(system.findings)}</div>
                  <div title="Over forecast (0..1)">Cost {metric(system.cost)}</div>
                </div>
                <p className="mt-3 text-xs text-slate-200">{system.action}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {system.links?.g && (
                    <a
                      href={system.links.g}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-900"
                    >
                      Grafana
                    </a>
                  )}
                  {system.links?.s && (
                    <a
                      href={system.links.s}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-900"
                    >
                      SecHub
                    </a>
                  )}
                  {system.links?.c && (
                    <a
                      href={system.links.c}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-900"
                    >
                      Cost
                    </a>
                  )}
                </div>
              </Card>
            ))}
            {!systems.length && (
              <div className="text-sm text-slate-400">No systems match this filter.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
