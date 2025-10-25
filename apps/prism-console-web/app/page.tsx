"use client";

import { AgentTable } from "@/components/AgentTable";
import { MetricCard } from "@/components/MetricCard";
import { ShortcutGrid } from "@/components/ShortcutGrid";
import { Skeleton } from "@/components/Skeleton";
import { useAgents } from "@/hooks/useAgents";
import { useDashboard } from "@/hooks/useDashboard";

export default function OverviewPage() {
  const { data: dashboard, isLoading: isDashboardLoading } = useDashboard();
  const { data: agents, isLoading: isAgentsLoading } = useAgents();

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-lg font-semibold text-white">Operations Overview</h2>
        <p className="text-sm text-slate-400">Live state mirrored from the Prism mobile console.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {isDashboardLoading
            ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32" />)
            : dashboard?.metrics?.map((metric) => (
                <MetricCard key={metric.id} label={metric.label} value={metric.value} trend={metric.trend} change={metric.change} />
              ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Agent Health</h2>
            <p className="text-sm text-slate-400">Status, domains, and memory footprint for registered agents.</p>
          </div>
          {dashboard && (
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm text-slate-300">
              <span className="font-semibold text-white">{dashboard.activeAgents}</span> active •
              <span className="ml-2 font-semibold text-white">{dashboard.averageLatencyMs} ms</span> avg latency
            </div>
          )}
        </div>
        <div className="mt-4">
          <AgentTable agents={agents ?? []} isLoading={isAgentsLoading} />
        </div>
      </section>


      {dashboard && (
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold text-white">System uptime</h2>
            <p className="mt-2 text-sm text-slate-300">{dashboard.systemUptime}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">Incidents (24h): {dashboard.incidents24h}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold text-white">Regional latency (p95)</h2>
            <ul className="mt-3 space-y-2">
              {dashboard.latency.map((sample) => (
                <li key={sample.region} className="flex items-center justify-between text-sm text-slate-300">
                  <span className="font-medium text-white">{sample.region}</span>
                  <span>{sample.p95Ms} ms</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      {dashboard && (
        <section>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Runbook Shortcuts</h2>
              <p className="text-sm text-slate-400">Jump into orchestrations without leaving the console.</p>
            </div>
            <span className="text-xs uppercase tracking-wide text-slate-400">Synced with CLI</span>
          </div>
          <div className="mt-4">
            <ShortcutGrid shortcuts={dashboard.shortcuts} />
          </div>
        </section>
      )}
    </div>
  );
}
