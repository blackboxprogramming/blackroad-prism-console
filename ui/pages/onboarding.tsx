import { useEffect, useMemo, useState } from "react";

type PlatformStatus = {
  name: string;
  integration_id: string;
  status: string;
  scopes: string[];
  credential_source: string;
  verified_at?: string;
  details?: string | null;
};

type AgentRecord = {
  name: string;
  role: string;
  email?: string;
  key_id: string;
  key_fingerprint: string;
  permissions: string[];
  platforms: PlatformStatus[];
};

type RegistrySnapshot = {
  generated_at?: string;
  agents: AgentRecord[];
};

type SummaryCounts = {
  total: number;
  healthy: number;
  warnings: number;
  blocking: number;
};

const STATUS_BADGE: Record<string, { label: string; tone: string }> = {
  connected: { label: "Connected", tone: "#0f9d58" },
  expired: { label: "Token Expired", tone: "#f4b400" },
  missing_credentials: { label: "Missing Credentials", tone: "#db4437" },
  invalid: { label: "Verification Failed", tone: "#db4437" },
};

function fetchRegistry(): Promise<RegistrySnapshot> {
  return fetch("/api/registry/platform_connections", {
    cache: "no-store",
    credentials: "include",
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load registry (${response.status})`);
      }
      return (await response.json()) as RegistrySnapshot;
    });
}

function computeSummary(snapshot: RegistrySnapshot | null): SummaryCounts {
  if (!snapshot) {
    return { total: 0, healthy: 0, warnings: 0, blocking: 0 };
  }

  return snapshot.agents.reduce<SummaryCounts>((acc, agent) => {
    acc.total += 1;
    const statuses = agent.platforms.map((platform) => platform.status);
    if (statuses.every((status) => status === "connected")) {
      acc.healthy += 1;
    } else if (statuses.some((status) => status === "expired")) {
      acc.warnings += 1;
    } else {
      acc.blocking += 1;
    }
    return acc;
  }, { total: 0, healthy: 0, warnings: 0, blocking: 0 });
}

function formatTimestamp(value?: string): string {
  if (!value) {
    return "—";
  }
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
}

function renderStatusBadge(status: string): JSX.Element {
  const badge = STATUS_BADGE[status] ?? { label: status, tone: "#5f6368" };
  return (
    <span
      style={{
        backgroundColor: `${badge.tone}1f`,
        border: `1px solid ${badge.tone}`,
        borderRadius: "999px",
        color: badge.tone,
        display: "inline-block",
        fontSize: "0.75rem",
        fontWeight: 600,
        padding: "0.15rem 0.6rem",
        textTransform: "uppercase",
      }}
    >
      {badge.label}
    </span>
  );
}

export default function OnboardingDashboard(): JSX.Element {
  const [registry, setRegistry] = useState<RegistrySnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchRegistry()
      .then((snapshot) => {
        if (!cancelled) {
          setRegistry(snapshot);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError((err as Error).message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => computeSummary(registry), [registry]);

  return (
    <div
      style={{
        backgroundColor: "#0f172a",
        color: "#e2e8f0",
        minHeight: "100vh",
        padding: "2.5rem 3rem",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.25rem", marginBottom: "0.25rem" }}>
          Agent Deployment & Onboarding
        </h1>
        <p style={{ color: "#94a3b8", maxWidth: "48rem" }}>
          Live view of credential verification, platform integrations, and role
          assignments across the Codex agent fleet.
        </p>
      </header>

      <section
        style={{
          backgroundColor: "#1e293b",
          borderRadius: "1rem",
          display: "grid",
          gap: "1.25rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          marginBottom: "2rem",
          padding: "1.5rem",
        }}
      >
        {[{
          label: "Agents",
          value: summary.total,
        }, {
          label: "Healthy",
          value: summary.healthy,
        }, {
          label: "Warnings",
          value: summary.warnings,
        }, {
          label: "Blocking",
          value: summary.blocking,
        }].map((card) => (
          <div key={card.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: 700 }}>{card.value}</div>
            <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>{card.label}</div>
          </div>
        ))}
      </section>

      {loading && (
        <div style={{ color: "#94a3b8" }}>Loading deployment data…</div>
      )}

      {error && !loading && (
        <div
          style={{
            backgroundColor: "#7f1d1d",
            borderRadius: "0.75rem",
            padding: "1rem 1.25rem",
          }}
        >
          <strong style={{ display: "block", marginBottom: "0.5rem" }}>
            Unable to load onboarding registry
          </strong>
          <span style={{ color: "#fecaca" }}>{error}</span>
        </div>
      )}

      {!error && !loading && registry && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {registry.agents.map((agent) => (
            <article
              key={agent.name}
              style={{
                backgroundColor: "#1f2937",
                borderRadius: "1rem",
                padding: "1.5rem",
              }}
            >
              <header
                style={{
                  alignItems: "baseline",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h2 style={{ fontSize: "1.5rem", margin: 0 }}>{agent.name}</h2>
                  <p style={{ color: "#94a3b8", margin: 0 }}>
                    {agent.role.toUpperCase()} • Key {agent.key_id} • Fingerprint {agent.key_fingerprint}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Permissions</div>
                  <div style={{ fontSize: "0.85rem" }}>
                    {agent.permissions.length > 0 ? agent.permissions.join(", ") : "—"}
                  </div>
                </div>
              </header>

              <table
                style={{
                  marginTop: "1.25rem",
                  width: "100%",
                  borderSpacing: "0 0.5rem",
                }}
              >
                <thead style={{ textAlign: "left", color: "#94a3b8", fontSize: "0.8rem" }}>
                  <tr>
                    <th style={{ padding: "0.25rem 0.5rem" }}>Platform</th>
                    <th style={{ padding: "0.25rem 0.5rem" }}>Status</th>
                    <th style={{ padding: "0.25rem 0.5rem" }}>Scopes</th>
                    <th style={{ padding: "0.25rem 0.5rem" }}>Source</th>
                    <th style={{ padding: "0.25rem 0.5rem" }}>Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {agent.platforms.map((platform) => (
                    <tr key={`${agent.name}-${platform.integration_id}`}>
                      <td style={{ padding: "0.4rem 0.5rem" }}>
                        <strong>{platform.name}</strong>
                        {platform.details && (
                          <div style={{ color: "#fcd34d", fontSize: "0.75rem" }}>
                            {platform.details}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "0.4rem 0.5rem" }}>
                        {renderStatusBadge(platform.status)}
                      </td>
                      <td style={{ padding: "0.4rem 0.5rem", color: "#cbd5f5" }}>
                        {platform.scopes.length > 0 ? platform.scopes.join(", ") : "—"}
                      </td>
                      <td style={{ padding: "0.4rem 0.5rem", color: "#94a3b8" }}>
                        {platform.credential_source}
                      </td>
                      <td style={{ padding: "0.4rem 0.5rem", color: "#94a3b8" }}>
                        {formatTimestamp(platform.verified_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
