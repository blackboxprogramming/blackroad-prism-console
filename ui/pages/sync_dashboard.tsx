import { useCallback, useEffect, useMemo, useState } from "react";

type SyncEvent = {
  timestamp: string;
  action: string;
  payload: Record<string, unknown>;
  host?: string;
};

type ScheduledTask = {
  source: string;
  target: string;
  agent: string;
  schedule: string | null;
};

type SyncStatus = {
  scheduled: Record<string, ScheduledTask>;
  queue_depth: number;
  last_events: SyncEvent[];
};

type Repo = {
  name: string;
  url: string;
  purpose: string;
  last_commit?: string | null;
};

type CollectiveContext = {
  repo_list: Repo[];
  active_projects: Array<{ id: string; title: string; status: string; owner: string }>;
  last_commit_summary: Array<{
    repo: string;
    author: string;
    message: string;
    sha: string;
    committed_at: string;
  }>;
  notion_spaces: Array<{ id: string; title: string; url: string }>;
  linear_issues_summary: Array<{ id: string; title: string; status: string; assignee?: string }>;
  generated_at: string;
  refresh_interval_minutes: number;
};

type TriggerPayload = {
  source: string;
  target: string;
  agent: string;
  task?: string;
  payload?: Record<string, unknown>;
};

const formatDate = (value: string) => new Date(value).toLocaleString();

const fetchJson = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return (await response.json()) as T;
};

const SyncDashboard = () => {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [context, setContext] = useState<CollectiveContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const payload = await fetchJson<SyncStatus>("/api/sync/status");
      setStatus(payload);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const loadContext = useCallback(async () => {
    try {
      const payload = await fetchJson<CollectiveContext>("/api/context/");
      setContext(payload);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const triggerSync = useCallback(
    async (task: string, spec: ScheduledTask) => {
      const body: TriggerPayload = {
        source: spec.source,
        target: spec.target,
        agent: spec.agent,
        task,
      };
      setIsTriggering(true);
      try {
        await fetchJson("/api/sync/trigger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        await loadStatus();
      } finally {
        setIsTriggering(false);
      }
    },
    [loadStatus],
  );

  useEffect(() => {
    void loadStatus();
    void loadContext();
    const interval = window.setInterval(() => {
      void loadStatus();
    }, 15000);
    return () => window.clearInterval(interval);
  }, [loadContext, loadStatus]);

  const queueState = useMemo(() => {
    if (!status) return "unknown";
    if (status.queue_depth < 0) return "unavailable";
    if (status.queue_depth === 0) return "idle";
    if (status.queue_depth < 5) return "healthy";
    return "busy";
  }, [status]);

  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>BlackRoad Sync Dashboard</h1>
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      <section style={{ marginBottom: "2rem" }}>
        <h2>Sync Status</h2>
        <p>Queue depth: {status ? status.queue_depth : "…"} ({queueState})</p>
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {status &&
            Object.entries(status.scheduled).map(([key, task]) => (
              <article key={key} style={{ border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "1rem" }}>
                <h3 style={{ margin: 0 }}>{key}</h3>
                <p style={{ margin: "0.5rem 0" }}>
                  <strong>{task.source}</strong> → <strong>{task.target}</strong>
                </p>
                <p style={{ margin: 0 }}>Agent: {task.agent}</p>
                <p style={{ margin: "0.5rem 0" }}>Schedule: {task.schedule ?? "on-demand"}</p>
                <button
                  onClick={() => triggerSync(key, task)}
                  disabled={isTriggering}
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.375rem",
                    border: "none",
                    backgroundColor: "#111827",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Trigger
                </button>
              </article>
            ))}
        </div>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Recent Events</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {status?.last_events.map((event, index) => (
            <li key={`${event.timestamp}-${index}`} style={{ marginBottom: "0.75rem" }}>
              <strong>{event.action}</strong>
              <span style={{ marginLeft: "0.5rem", color: "#4b5563" }}>{formatDate(event.timestamp)}</span>
              <pre
                style={{
                  background: "#f3f4f6",
                  padding: "0.5rem",
                  borderRadius: "0.5rem",
                  overflowX: "auto",
                  marginTop: "0.25rem",
                }}
              >
                {JSON.stringify(event.payload, null, 2)}
              </pre>
            </li>
          )) || <li>No events yet.</li>}
        </ul>
      </section>

      <section>
        <h2>Collective Context</h2>
        <p>Last refresh: {context ? formatDate(context.generated_at) : "…"}</p>
        <h3>Repositories</h3>
        <ul>
          {context?.repo_list.map((repo) => (
            <li key={repo.name}>
              <a href={repo.url} target="_blank" rel="noreferrer">
                {repo.name}
              </a>{" "}
              – {repo.purpose}
            </li>
          ))}
        </ul>
        <h3>Active Projects</h3>
        <ul>
          {context?.active_projects.map((project) => (
            <li key={project.id}>
              {project.title} ({project.status}) — {project.owner}
            </li>
          ))}
        </ul>
        <h3>Linear Issues</h3>
        <ul>
          {context?.linear_issues_summary.map((issue) => (
            <li key={issue.id}>
              {issue.id}: {issue.title} [{issue.status}] {issue.assignee ? `— ${issue.assignee}` : ""}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default SyncDashboard;
