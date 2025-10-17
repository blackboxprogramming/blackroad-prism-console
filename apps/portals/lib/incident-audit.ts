import { sql } from '@vercel/postgres';

export type IncidentAuditAction = 'create' | 'resolve' | 'bulk';

export interface IncidentAuditRecord {
  id: number;
  time: string;
  actor_email: string | null;
  system_key: string | null;
  action: IncidentAuditAction;
  pd_incident_id: string | null;
  pd_url: string | null;
  jira_key: string | null;
  payload_hash: string | null;
  opened_at: string | null;
  resolved_at: string | null;
}

export interface InsertIncidentAuditParams {
  actorEmail?: string;
  systemKey?: string;
  action: IncidentAuditAction;
  pdIncidentId?: string;
  pdUrl?: string;
  jiraKey?: string;
  payloadHash?: string;
  openedAt?: Date;
  resolvedAt?: Date;
}

let ensured = false;

async function ensureAuditTable() {
  if (ensured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS ops_incident_audit (
      id SERIAL PRIMARY KEY,
      time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      actor_email TEXT,
      system_key TEXT,
      action TEXT CHECK (action IN ('create', 'resolve', 'bulk')),
      pd_incident_id TEXT,
      pd_url TEXT,
      jira_key TEXT,
      payload_hash TEXT,
      opened_at TIMESTAMPTZ,
      resolved_at TIMESTAMPTZ
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_ops_incident_audit_system_action_time
      ON ops_incident_audit (system_key, action, time DESC)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_ops_incident_audit_pd_id
      ON ops_incident_audit (pd_incident_id)
  `;
  ensured = true;
}

export async function insertIncidentAudit(params: InsertIncidentAuditParams) {
  await ensureAuditTable();
  const {
    actorEmail,
    systemKey,
    action,
    pdIncidentId,
    pdUrl,
    jiraKey,
    payloadHash,
    openedAt,
    resolvedAt,
  } = params;

  await sql`
    INSERT INTO ops_incident_audit
      (actor_email, system_key, action, pd_incident_id, pd_url, jira_key, payload_hash, opened_at, resolved_at)
    VALUES
      (${actorEmail ?? null}, ${systemKey ?? null}, ${action}, ${pdIncidentId ?? null},
       ${pdUrl ?? null}, ${jiraKey ?? null}, ${payloadHash ?? null},
       ${openedAt ?? null}, ${resolvedAt ?? null})
  `;
}

export async function findRecentCreateForSystem(systemKey: string, lookbackMinutes = 5) {
  await ensureAuditTable();
  const result = await sql<IncidentAuditRecord>`
    SELECT *
    FROM ops_incident_audit
    WHERE system_key = ${systemKey}
      AND action = 'create'
      AND time >= NOW() - INTERVAL '${lookbackMinutes} minutes'
    ORDER BY time DESC
    LIMIT 1
  `;
  return result.rows[0];
}

export async function getAuditByPagerDutyId(pdIncidentId: string) {
  await ensureAuditTable();
  const result = await sql<IncidentAuditRecord>`
    SELECT *
    FROM ops_incident_audit
    WHERE pd_incident_id = ${pdIncidentId}
    ORDER BY time DESC
    LIMIT 1
  `;
  return result.rows[0];
}

export async function listRecentAudit(limit = 50) {
  await ensureAuditTable();
  const result = await sql<IncidentAuditRecord>`
    SELECT *
    FROM ops_incident_audit
    ORDER BY time DESC
    LIMIT ${limit}
  `;
  return result.rows;
}
