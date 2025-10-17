"use client";

import useSWR from "swr";
import { useMemo, useState, type ReactNode } from "react";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) {
      throw new Error(`Request failed: ${r.status}`);
    }
    return r.json();
  });

type StatusResponse = {
  version?: string;
  version_tag?: string;
  canary_percent?: number;
  by?: string;
  ui_ok?: boolean;
  fivexx?: number;
  p95?: number;
  burn_rate_fast?: number;
  burn_rate_slow?: number;
  updated_at?: string;
  environment?: string;
  permissions?: {
    canOperate: boolean;
    reason?: string;
  };
};

type FlagsResponse = {
  version?: string;
  features?: Record<string, unknown>;
};

type Incident = {
  title: string;
  file: string;
  opened_at?: string;
  status?: string;
};

type IncidentsResponse = Incident[];

type OpsDashboardProps = {
  className?: string;
};

const Box = ({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) => (
  <div className="flex h-full flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    </div>
    <div className="text-sm text-slate-700">{children}</div>
  </div>
);

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
      <span className="font-medium text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function BurnGauge({
  label,
  value
}: {
  label: string;
  value: number | undefined;
}) {
  const pct = Math.max(0, Math.min(100, Math.round((value ?? 0) * 100)));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-amber-500 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function OpsDashboard({ className }: OpsDashboardProps) {
  const containerClassName = [
    "grid",
    "gap-4",
    "md:grid-cols-2",
    "xl:grid-cols-3",
    className
  ]
    .filter(Boolean)
    .join(" ");

  const { data: status, error: statusError, isLoading: statusLoading, mutate: refreshStatus } = useSWR<StatusResponse>(
    "/api/ops/status",
    fetcher,
    { refreshInterval: 30000 }
  );
  const { data: flags, error: flagsError, isLoading: flagsLoading } = useSWR<FlagsResponse>(
    "/api/ops/flags",
    fetcher,
    { refreshInterval: 60000 }
  );
  const { data: incidents, error: incidentsError, isLoading: incidentsLoading, mutate: refreshIncidents } =
    useSWR<IncidentsResponse>("/api/ops/incidents", fetcher, { refreshInterval: 60000 });
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const readOnly = status?.permissions ? !status.permissions.canOperate : false;
  const readOnlyReason = status?.permissions?.reason;

  const deployMeta = useMemo(() => {
    const versionLabel = status?.version_tag ?? status?.version ?? "unknown";
    return {
      version: versionLabel,
      canary: typeof status?.canary_percent === "number" ? `${status.canary_percent}%` : "0%",
      operator: status?.by ?? "unknown",
      environment: status?.environment ?? "production"
    };
  }, [status]);

  async function trigger(path: string) {
    if (readOnly) return;
    try {
      setBusyAction(path);
      const res = await fetch(`/api/ops/${path}`, { method: "POST" });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || `Action ${path} failed`);
      }
      await Promise.all([refreshStatus(), refreshIncidents()]);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Unable to trigger action");
    } finally {
      setBusyAction(null);
    }
  }

  const features = useMemo(() => {
    if (!flags?.features) return [] as Array<[string, unknown]>;
    return Object.entries(flags.features).sort(([a], [b]) => a.localeCompare(b));
  }, [flags]);

  const incidentsList = useMemo(() => {
    if (!incidents?.length) return [] as Incident[];
    return incidents;
  }, [incidents]);

  return (
    <section className={containerClassName}>
      <div className="md:col-span-1 xl:col-span-1">
        <Box title="Deploy">
          <div className="space-y-2">
            {statusLoading ? (
              <div className="text-sm text-slate-500">Loading status…</div>
            ) : statusError ? (
              <div className="text-sm text-red-600">Unable to load deploy status.</div>
            ) : (
              <div className="space-y-2">
                <Stat label="Version" value={deployMeta.version} />
                <Stat label="Canary" value={deployMeta.canary} />
                <Stat label="Last deployer" value={deployMeta.operator} />
                <Stat label="Environment" value={deployMeta.environment} />
                {status?.updated_at && (
                  <Stat label="Updated" value={new Date(status.updated_at).toLocaleString()} />
                )}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {["go-no-go", "ladder", "rollback"].map((action) => (
                <button
                  key={action}
                  disabled={readOnly || busyAction !== null}
                  onClick={() => trigger(action)}
                  className={`btn flex-1 whitespace-nowrap px-3 py-2 text-sm font-semibold ${
                    readOnly ? "cursor-not-allowed opacity-60" : ""
                  }`}
                >
                  {busyAction === action ? "Working…" : action.replace("-", " ")}
                </button>
              ))}
            </div>
            {readOnly && (
              <p className="text-xs text-amber-600">
                Operator controls disabled{readOnlyReason ? `: ${readOnlyReason}` : ""}.
              </p>
            )}
          </div>
        </Box>
      </div>

      <div className="md:col-span-1 xl:col-span-1">
        <Box title="Health">
          {statusLoading ? (
            <div className="text-sm text-slate-500">Loading health…</div>
          ) : statusError ? (
            <div className="text-sm text-red-600">Unable to load health metrics.</div>
          ) : (
            <div className="space-y-2">
              <Stat label="UI" value={status?.ui_ok ? "✅ up" : "❌ down"} />
              <Stat label="5xx (5m)" value={status?.fivexx ?? 0} />
              <Stat label="p95 latency (ms)" value={status?.p95 ?? 0} />
            </div>
          )}
        </Box>
      </div>

      <div className="md:col-span-1 xl:col-span-1">
        <Box title="Burn Rate">
          {statusLoading ? (
            <div className="text-sm text-slate-500">Loading burn rate…</div>
          ) : statusError ? (
            <div className="text-sm text-red-600">Unable to load burn rate.</div>
          ) : (
            <div className="space-y-3">
              <BurnGauge label="Fast" value={status?.burn_rate_fast} />
              <BurnGauge label="Slow" value={status?.burn_rate_slow} />
            </div>
          )}
        </Box>
      </div>

      <div className="md:col-span-2 xl:col-span-1">
        <Box title="Flags">
          {flagsLoading ? (
            <div className="text-sm text-slate-500">Loading flags…</div>
          ) : flagsError ? (
            <div className="text-sm text-red-600">Unable to load feature flags.</div>
          ) : features.length ? (
            <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
              {features.map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-4 px-3 py-2 text-xs">
                  <span className="font-semibold text-slate-600">{key}</span>
                  <span className="font-mono text-slate-800">{JSON.stringify(value)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500">No feature flags configured.</div>
          )}
          {flags?.version && <p className="pt-2 text-xs text-slate-500">Version: {flags.version}</p>}
        </Box>
      </div>

      <div className="md:col-span-2 xl:col-span-1">
        <Box title="Incidents (24h)">
          {incidentsLoading ? (
            <div className="text-sm text-slate-500">Checking incidents…</div>
          ) : incidentsError ? (
            <div className="text-sm text-red-600">Unable to load incidents.</div>
          ) : incidentsList.length ? (
            <div className="space-y-2">
              {incidentsList.map((incident) => (
                <div
                  key={incident.file}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs shadow-inner"
                >
                  <div className="font-semibold text-slate-800">{incident.title}</div>
                  <div className="text-slate-500">
                    {incident.status ? `${incident.status} • ` : ""}
                    {incident.opened_at ? new Date(incident.opened_at).toLocaleString() : incident.file}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500">No active incidents in the last 24 hours.</div>
          )}
          <div className="pt-2 text-right">
            <button className="btn px-3 py-2 text-xs font-semibold" onClick={() => refreshIncidents()} disabled={incidentsLoading}>
              Refresh
            </button>
          </div>
        </Box>
      </div>
    </section>
  );
}
