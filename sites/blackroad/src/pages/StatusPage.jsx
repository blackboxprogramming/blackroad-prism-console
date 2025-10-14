import { useEffect, useState } from "react";

const SYSTEMS = [
  {
    name: "Platform API",
    status: "operational",
    description: "Realtime inference, webhooks, and health endpoints powering the agent mesh.",
  },
  {
    name: "Lucidia IDE",
    status: "operational",
    description: "Voice-to-code editing surface, testing harness, and deployment orchestrator.",
  },
  {
    name: "RoadView Studio",
    status: "degraded",
    description: "Render farm and streaming exporters. Minor delay on 4K renders while we expand capacity.",
  },
  {
    name: "RoadCoin Network",
    status: "maintenance",
    description: "Scheduled ledger upgrade to improve cross-border payouts and compliance auditing.",
  },
  {
    name: "Knowledge Graph",
    status: "operational",
    description: "Explorer agent index, research ingestion pipelines, and document embeddings.",
  },
];

const UPTIME = [
  { label: "30 day", value: "99.97%" },
  { label: "90 day", value: "99.92%" },
  { label: "12 month", value: "99.88%" },
];

const HISTORY = [
  {
    date: "Aug 18, 2025",
    state: "resolved",
    title: "RoadView rendering queue backlog",
    detail: "Scaled GPU workers and rebalanced cache warmers. Catch-up completed in 22 minutes.",
  },
  {
    date: "Aug 3, 2025",
    state: "postmortem",
    title: "RoadCoin payout latency",
    detail: "Integrating new compliance checks introduced delay. Rolled out fast-lane signing with extra monitoring.",
  },
  {
    date: "Jul 24, 2025",
    state: "maintenance",
    title: "Knowledge graph embedding refresh",
    detail: "Upgraded retrieval models and reindexed community datasets. No downtime for live agents.",
  },
];

const STATUS_TONE = {
  operational: "text-green-400",
  degraded: "text-amber-300",
  maintenance: "text-[#FDBA2D]",
  resolved: "text-slate-200",
  postmortem: "text-slate-200",
};

function StatusBadge({ state }) {
  const tone = STATUS_TONE[state] || "text-slate-300";
  const label = state.replace(/^(.)/, (c) => c.toUpperCase());
  return (
    <span className={`text-xs font-semibold uppercase tracking-wide ${tone}`}>
      {label}
    </span>
  );
}

export default function StatusPage() {
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchFn = typeof globalThis.fetch === "function" ? globalThis.fetch : null;
    if (!fetchFn) {
      setError(true);
      return () => {
        cancelled = true;
      };
    }

    fetchFn("/status.json", { cache: "no-cache" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to fetch status");
        return response.json();
      })
      .then((data) => {
        if (!cancelled) {
          setMeta(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const timestamp = meta?.ts ? new Date(meta.ts) : null;

  return (
    <div className="min-h-screen bg-[#05070F] px-6 py-16 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        <header className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Platform Status</p>
          <h1 className="text-4xl font-bold md:text-5xl">BlackRoad systems pulse check</h1>
          <p className="max-w-3xl text-lg text-slate-300">
            Live telemetry from the operating system that powers creators, studios, and enterprises. We publish uptime, incidents,
            and maintenance windows so you can plan launches with confidence.
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-slate-300">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Last update</p>
              <p className="text-white">{timestamp ? timestamp.toLocaleString() : "Loading…"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Commit</p>
              <p className="font-mono text-white">{meta?.ref ? meta.ref.slice(0, 7) : "--"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Run ID</p>
              <p className="font-mono text-white">{meta?.run ?? "--"}</p>
            </div>
            {error ? <p className="text-xs uppercase tracking-wide text-red-400">Status fetch failed — showing cached data.</p> : null}
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          {SYSTEMS.map((system) => (
            <article key={system.name} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{system.name}</h2>
                  <p className="mt-2 text-sm text-slate-300">{system.description}</p>
                </div>
                <StatusBadge state={system.status} />
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Reliability</p>
              <h2 className="text-2xl font-semibold">Uptime commitment</h2>
              <p className="mt-2 max-w-xl text-sm text-slate-300">
                Multi-region failover, hot-standby inference clusters, and rate-limited ingestion keep the platform resilient even
                during peak launches.
              </p>
            </div>
            <div className="flex gap-6 text-right text-sm text-slate-200">
              {UPTIME.map((item) => (
                <div key={item.label}>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
                  <p className="text-2xl font-bold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Recent activity</p>
          <div className="mt-6 space-y-4">
            {HISTORY.map((entry) => (
              <article key={entry.title} className="rounded-xl border border-white/5 bg-black/40 p-4 text-sm text-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-semibold text-white">{entry.title}</div>
                  <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
                    <span>{entry.date}</span>
                    <StatusBadge state={entry.state} />
                  </div>
                </div>
                <p className="mt-3 text-slate-300">{entry.detail}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 text-xs uppercase tracking-wide text-slate-500">
            Need a deeper dive? Email <a className="text-[#80d0ff]" href="mailto:status@blackroad.io">status@blackroad.io</a> for
            postmortems and integration guidance.
          </p>
        </section>
      </div>
    </div>
  );
}
