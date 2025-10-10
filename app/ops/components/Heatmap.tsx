"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { RiskSystem } from "@/lib/ops/risk";
import type { IncidentAuditRecord } from "@/lib/ops/db";

interface Props {
  initialSystems: RiskSystem[];
  initialAudit: IncidentAuditRecord[];
  generatedAt: string;
}

interface OpsUser {
  email: string;
  groups: string;
}

const STORAGE_KEY = "ops-portal-user";

export default function Heatmap({ initialSystems, initialAudit, generatedAt }: Props) {
  const [systems, setSystems] = useState(initialSystems);
  const [audit, setAudit] = useState(initialAudit);
  const [user, setUser] = useState<OpsUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [smokeLoading, setSmokeLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.email) {
          setUser(parsed);
        }
      }
    } catch (err) {
      console.warn("failed to load ops user", err);
    }
  }, []);

  const hasOpsAccess = useMemo(() => Boolean(user?.email && user?.groups), [user]);

  function withUserHeaders(headers: Record<string, string> = {}) {
    const next: Record<string, string> = { ...headers };
    if (user?.email) next["x-user-email"] = user.email;
    if (user?.groups) next["x-user-groups"] = user.groups;
    return next;
  }

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [riskRes, auditRes] = await Promise.all([
        fetch("/api/scorecard/risk?sandbox=1"),
        hasOpsAccess
          ? fetch("/api/pd/audit", { headers: withUserHeaders() })
          : Promise.resolve(new Response(JSON.stringify({ events: [] })))
      ]);

      if (!riskRes.ok) {
        throw new Error(`risk_fetch_${riskRes.status}`);
      }
      const riskData = await riskRes.json();
      setSystems(Array.isArray(riskData.systems) ? riskData.systems : []);

      if (auditRes.ok) {
        const auditData = await auditRes.json();
        if (Array.isArray(auditData.events)) {
          setAudit(auditData.events);
        }
      }
    } catch (err: any) {
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(system: RiskSystem) {
    if (!hasOpsAccess || !system.pdIncidentId) {
      return;
    }
    const postmortemUrl = window.prompt("Post-mortem URL (optional):") || "";
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/pd/resolve", {
        method: "POST",
        headers: withUserHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ incidentId: system.pdIncidentId, postmortemUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.details || data?.error || "pd_resolve_failed");
      }
      setMessage(`Resolved PD incident ${system.pdIncidentId}`);
      await refresh();
    } catch (err: any) {
      setError(String(err?.message || err));
    }
  }

  async function handleCreate(system: RiskSystem) {
    if (!hasOpsAccess) return;
    setMessage(null);
    setError(null);
    try {
      const payload = {
        systemKey: system.key,
        title: `${system.name}: ${system.action}`,
        details: `Risk score ${system.risk.toFixed(2)}\nOwner: ${system.owner || "n/a"}`,
      };
      const res = await fetch("/api/pd/create", {
        method: "POST",
        headers: withUserHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.status === 409) {
        throw new Error(data?.error || "already_opened_recently");
      }
      if (!res.ok) {
        throw new Error(data?.details || data?.error || "pd_create_failed");
      }
      if (data?.dedup) {
        setMessage(`Reusing PD incident ${data.incidentId}`);
      } else {
        setMessage(`Created PD incident ${data.incidentId}`);
      }
      await refresh();
    } catch (err: any) {
      setError(String(err?.message || err));
    }
  }

  async function handleBulk() {
    if (!hasOpsAccess) return;
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/pd/bulk", {
        method: "POST",
        headers: withUserHeaders({ "Content-Type": "application/json" }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.reason === "threshold_not_met") {
          setMessage("Threshold not met for sweep");
          return;
        }
        throw new Error(data?.details || data?.error || "pd_bulk_failed");
      }
      if (data?.dedup) {
        setMessage(`Reusing sweep PD incident ${data.incidentId}`);
      } else {
        setMessage(`Opened sweep PD incident ${data.incidentId}`);
      }
      await refresh();
    } catch (err: any) {
      setError(String(err?.message || err));
    }
  }

  async function handleSmoke() {
    if (!hasOpsAccess) return;
    setMessage(null);
    setError(null);
    setSmokeLoading(true);
    try {
      const res = await fetch("/api/smoke/pd-jira?sandbox=1", {
        method: "POST",
        headers: withUserHeaders({ "Content-Type": "application/json" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || "smoke_failed");
      }
      const pd = data.pd ? `PD ${data.pd}` : "";
      const jira = data.jira ? `Jira ${data.jira}` : "";
      const parts = ["Smoke passed", pd, jira].filter(Boolean);
      setMessage(parts.join("\n"));
      await refresh();
    } catch (err: any) {
      setError(String(err?.message || err));
    } finally {
      setSmokeLoading(false);
    }
  }

  function updateUser(next: OpsUser) {
    setUser(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }

  return (
    <section style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
          <UserForm value={user} onChange={updateUser} />
          <button onClick={refresh} disabled={loading} style={buttonStyle}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button
            onClick={handleBulk}
            disabled={!hasOpsAccess || loading}
            style={{ ...buttonStyle, backgroundColor: "#f59e0b", color: "#0f172a" }}
          >
            Open PD Sweep
          </button>
          <button
            onClick={handleSmoke}
            disabled={!hasOpsAccess || loading || smokeLoading}
            style={{ ...buttonStyle, backgroundColor: "#0ea5e9", color: "white" }}
          >
            {smokeLoading ? "Running Smoke…" : "Run PD+Jira Smoke"}
          </button>
          <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
            Snapshot: {new Date(generatedAt).toLocaleString()}
          </span>
        </div>
        {message && <p style={{ color: "#16a34a", marginBottom: "0.75rem" }}>{message}</p>}
        {error && <p style={{ color: "#f87171", marginBottom: "0.75rem" }}>{error}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
          {systems.map((system) => (
            <article key={system.key} style={{
              borderRadius: "12px",
              padding: "1rem",
              background: cardColor(system.color),
              color: "#0f172a",
              boxShadow: "0 8px 16px rgba(15, 23, 42, 0.15)",
            }}>
              <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>{system.name}</h2>
                  <p style={{ margin: 0, fontSize: "0.85rem" }}>Risk {system.risk.toFixed(2)}</p>
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: 500 }}>{system.color.toUpperCase()}</span>
              </header>
              <p style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>{system.action}</p>
              {system.owner && (
                <p style={{ marginTop: "0.25rem", fontSize: "0.8rem", color: "#1e293b" }}>Owner: {system.owner}</p>
              )}
              {system.pdIncidentId ? (
                <p style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>
                  PD: <a href={system.pdUrl || "#"} target="_blank" rel="noreferrer">{system.pdIncidentId}</a>
                  {system.openedAt && (
                    <span style={{ marginLeft: "0.25rem", color: "#475569" }}>
                      (opened {new Date(system.openedAt).toLocaleString()})
                    </span>
                  )}
                </p>
              ) : (
                <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#475569" }}>No open PD incident</p>
              )}
              {system.jiraKey && (
                <p style={{ marginTop: "0.35rem", fontSize: "0.8rem" }}>
                  Jira: <a href={system.jiraUrl || "#"} target="_blank" rel="noreferrer">{system.jiraKey}</a>
                </p>
              )}
              <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  onClick={() => handleCreate(system)}
                  disabled={!hasOpsAccess || loading}
                  style={{ ...buttonStyle, backgroundColor: "#2563eb", color: "white" }}
                >
                  Open PD
                </button>
                {system.color === "red" && system.pdIncidentId && (
                  <button
                    onClick={() => handleResolve(system)}
                    disabled={!hasOpsAccess || loading}
                    style={{ ...buttonStyle, backgroundColor: "#22c55e", color: "#0f172a" }}
                  >
                    Resolve PD
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
      <aside>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Recent PD ops</h3>
        <div style={{ borderRadius: "12px", border: "1px solid #cbd5f5", padding: "0.75rem", maxHeight: "28rem", overflowY: "auto" }}>
          {audit.length === 0 && <p style={{ fontSize: "0.85rem", color: "#64748b" }}>No recent actions.</p>}
          {audit.map((event) => (
            <div key={event.id} style={{ marginBottom: "0.75rem" }}>
              <div style={{ fontSize: "0.8rem", color: "#475569" }}>
                {new Date(event.createdAt).toLocaleString()} · {event.actorEmail}
              </div>
              <div style={{ fontSize: "0.9rem", fontWeight: 500 }}>
                {event.action.toUpperCase()} {event.systemKey ? `(${event.systemKey})` : ""}
              </div>
              {event.pdIncidentId && (
                <div style={{ fontSize: "0.8rem" }}>PD: {event.pdIncidentId}</div>
              )}
              {event.jiraKey && (
                <div style={{ fontSize: "0.8rem" }}>Jira: {event.jiraKey}</div>
              )}
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}

function cardColor(color: RiskSystem["color"]): string {
  switch (color) {
    case "red":
      return "#fee2e2";
    case "yellow":
      return "#fef3c7";
    default:
      return "#dcfce7";
  }
}

function UserForm({ value, onChange }: { value: OpsUser | null; onChange: (next: OpsUser) => void }) {
  const [local, setLocal] = useState<OpsUser>({ email: value?.email || "", groups: value?.groups || "Ops" });

  useEffect(() => {
    setLocal({ email: value?.email || "", groups: value?.groups || "Ops" });
  }, [value?.email, value?.groups]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onChange(local);
      }}
      style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
    >
      <input
        type="email"
        required
        placeholder="ops@blackroadinc.us"
        value={local.email}
        onChange={(e) => setLocal((prev) => ({ ...prev, email: e.target.value }))}
        style={inputStyle}
      />
      <input
        type="text"
        required
        placeholder="Ops,Security"
        value={local.groups}
        onChange={(e) => setLocal((prev) => ({ ...prev, groups: e.target.value }))}
        style={inputStyle}
      />
      <button type="submit" style={buttonStyle}>
        Save
      </button>
    </form>
  );
}

const buttonStyle: CSSProperties = {
  padding: "0.5rem 0.9rem",
  borderRadius: "9999px",
  border: "none",
  cursor: "pointer",
  fontSize: "0.85rem",
  fontWeight: 600,
  backgroundColor: "#e2e8f0",
  color: "#0f172a",
};

const inputStyle: CSSProperties = {
  padding: "0.45rem 0.75rem",
  borderRadius: "8px",
  border: "1px solid #cbd5f5",
  fontSize: "0.85rem",
};
