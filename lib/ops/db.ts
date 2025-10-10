import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { randomUUID } from "crypto";

export type IncidentAction = "create" | "resolve" | "bulk";

export interface IncidentAuditRecord {
  id: string;
  createdAt: string;
  actorEmail: string;
  action: IncidentAction;
  systemKey: string | null;
  pdIncidentId: string | null;
  url: string | null;
  payloadHash: string | null;
  details: string | null;
  jiraKey: string | null;
}

const defaultDbPath = process.env.DB_PATH || "/srv/blackroad-api/blackroad.db";
const dbPath = process.env.PD_DB_PATH || defaultDbPath;

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS ops_incident_audit (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    actor_email TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('create','resolve','bulk')),
    system_key TEXT,
    pd_incident_id TEXT,
    url TEXT,
    payload_hash TEXT,
    details TEXT,
    jira_key TEXT
  );
`);

try {
  db.exec("ALTER TABLE ops_incident_audit ADD COLUMN jira_key TEXT");
} catch (err: any) {
  if (!String(err?.message || err).includes("duplicate column name")) {
    throw err;
  }
}

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_ops_incident_system_created_at
    ON ops_incident_audit(system_key, created_at DESC);
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_ops_incident_pd_created_at
    ON ops_incident_audit(pd_incident_id, created_at DESC);
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_ops_incident_action_created_at
    ON ops_incident_audit(action, created_at DESC);
`);

const insertStmt = db.prepare(
  `INSERT INTO ops_incident_audit (
      id, actor_email, action, system_key, pd_incident_id, url, payload_hash, details, jira_key
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

const recentStmt = db.prepare(
  `SELECT id, created_at, actor_email, action, system_key, pd_incident_id, url, payload_hash, details, jira_key
   FROM ops_incident_audit
   ORDER BY datetime(created_at) DESC
   LIMIT ?`
);

const lastCreateStmt = db.prepare(
  `SELECT id, created_at, actor_email, action, system_key, pd_incident_id, url, payload_hash, details, jira_key
   FROM ops_incident_audit
   WHERE system_key = ?
     AND action IN ('create','bulk')
   ORDER BY datetime(created_at) DESC
   LIMIT 1`
);

const openIncidentStmt = db.prepare(
  `SELECT base.id, base.created_at, base.actor_email, base.action, base.system_key,
          base.pd_incident_id, base.url, base.payload_hash, base.details, base.jira_key
   FROM ops_incident_audit base
   WHERE base.system_key = ?
     AND base.action IN ('create','bulk')
     AND NOT EXISTS (
       SELECT 1 FROM ops_incident_audit r
       WHERE r.pd_incident_id = base.pd_incident_id
         AND r.action = 'resolve'
         AND datetime(r.created_at) >= datetime(base.created_at)
     )
   ORDER BY datetime(base.created_at) DESC
   LIMIT 1`
);

const findSystemByIncidentStmt = db.prepare(
  `SELECT system_key
   FROM ops_incident_audit
    WHERE pd_incident_id = ?
      AND action IN ('create','bulk')
   ORDER BY datetime(created_at) DESC
   LIMIT 1`
);

const findIncidentByPdStmt = db.prepare(
  `SELECT id, created_at, actor_email, action, system_key, pd_incident_id, url, payload_hash, details, jira_key
   FROM ops_incident_audit
   WHERE pd_incident_id = ?
     AND action IN ('create','bulk')
   ORDER BY datetime(created_at) DESC
   LIMIT 1`
);

const updateJiraKeyStmt = db.prepare(
  `UPDATE ops_incident_audit
   SET jira_key = ?
   WHERE id = ?`
);

db.exec(`
  CREATE TABLE IF NOT EXISTS ops_kv (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const selectKvStmt = db.prepare(
  `SELECT key, value, updated_at
   FROM ops_kv
   WHERE key = ?`
);

const upsertKvStmt = db.prepare(
  `INSERT INTO ops_kv (key, value, updated_at)
   VALUES (?, ?, datetime('now'))
   ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
);

export function logIncidentEvent(args: {
  actorEmail: string;
  action: IncidentAction;
  systemKey?: string | null;
  pdIncidentId?: string | null;
  url?: string | null;
  payloadHash?: string | null;
  details?: string | null;
  jiraKey?: string | null;
}): IncidentAuditRecord {
  const id = randomUUID();
  const {
    actorEmail,
    action,
    systemKey = null,
    pdIncidentId = null,
    url = null,
    payloadHash = null,
    details = null,
    jiraKey = null,
  } = args;
  insertStmt.run(
    id,
    actorEmail,
    action,
    systemKey,
    pdIncidentId,
    url,
    payloadHash,
    details,
    jiraKey,
  );
  return {
    id,
    createdAt: new Date().toISOString(),
    actorEmail,
    action,
    systemKey,
    pdIncidentId,
    url,
    payloadHash,
    details,
    jiraKey,
  };
}

export function getRecentIncidentEvents(limit = 10): IncidentAuditRecord[] {
  const rows = recentStmt.all(limit);
  return rows.map(mapRow);
}

export function getLastCreateForSystem(systemKey: string): IncidentAuditRecord | null {
  const row = lastCreateStmt.get(systemKey);
  return row ? mapRow(row) : null;
}

export function getOpenIncidentForSystem(systemKey: string): IncidentAuditRecord | null {
  const row = openIncidentStmt.get(systemKey);
  return row ? mapRow(row) : null;
}

export function getSystemForIncidentId(pdIncidentId: string): string | null {
  const row = findSystemByIncidentStmt.get(pdIncidentId);
  return row?.system_key ?? null;
}

export function getIncidentByPagerDutyId(pdIncidentId: string): IncidentAuditRecord | null {
  const row = findIncidentByPdStmt.get(pdIncidentId);
  return row ? mapRow(row) : null;
}

export function attachJiraKey(incidentRecordId: string, jiraKey: string): void {
  updateJiraKeyStmt.run(jiraKey, incidentRecordId);
}

export interface KeyValueRecord {
  key: string;
  value: string | null;
  updatedAt: string;
}

export function getKv(key: string): KeyValueRecord | null {
  const row = selectKvStmt.get(key);
  if (!row) return null;
  return { key: row.key, value: row.value ?? null, updatedAt: row.updated_at };
}

export function setKv(key: string, value: string | null): void {
  upsertKvStmt.run(key, value ?? null);
}

function mapRow(row: any): IncidentAuditRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    actorEmail: row.actor_email,
    action: row.action,
    systemKey: row.system_key ?? null,
    pdIncidentId: row.pd_incident_id ?? null,
    url: row.url ?? null,
    payloadHash: row.payload_hash ?? null,
    details: row.details ?? null,
    jiraKey: row.jira_key ?? null,
  };
}
