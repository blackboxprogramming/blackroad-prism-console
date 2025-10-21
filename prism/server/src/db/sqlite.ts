import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { PrismEvent } from '@prism/core';

let db: Database.Database | null = null;

export function initDb(dbPath: string) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  db = new Database(dbPath);
  db.exec(`CREATE TABLE IF NOT EXISTS events(
    id TEXT PRIMARY KEY,
    ts TEXT,
    actor TEXT,
    kind TEXT,
    projectId TEXT,
    sessionId TEXT,
    facet TEXT,
    summary TEXT,
    ctx TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_events_project ON events(projectId);
  CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);`);
  return db;
}

export function getDb() {
  if (!db) throw new Error('DB not initialized');
  return db;
}

export function insertEvent(event: PrismEvent) {
  const database = getDb();
  const stmt = database.prepare(`INSERT INTO events(id, ts, actor, kind, projectId, sessionId, facet, summary, ctx)
    VALUES(@id, @ts, @actor, @kind, @projectId, @sessionId, @facet, @summary, @ctx)`);
  stmt.run({ ...event, ctx: event.ctx ? JSON.stringify(event.ctx) : null });
}

export function listEvents(projectId: string, limit: number) {
  const database = getDb();
  const stmt = database.prepare(`SELECT * FROM events WHERE projectId = ? ORDER BY ts DESC LIMIT ?`);
  const rows = stmt.all(projectId, limit) as (Omit<PrismEvent, 'ctx'> & { ctx: string | null })[];
  return rows.map(r => ({ ...r, ctx: r.ctx ? JSON.parse(r.ctx) : undefined }));
}
