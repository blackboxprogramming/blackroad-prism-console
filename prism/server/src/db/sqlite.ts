import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { PrismEvent } from '@prism/core';
import { IntelligenceEvent } from '../types';

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
  CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
  CREATE TABLE IF NOT EXISTS intelligence_events(
    id TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    source TEXT NOT NULL,
    channel TEXT NOT NULL,
    parent_id TEXT,
    tags TEXT,
    payload TEXT NOT NULL,
    meta TEXT NOT NULL,
    causal_chain TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_intel_events_ts ON intelligence_events(timestamp);
  CREATE INDEX IF NOT EXISTS idx_intel_events_topic ON intelligence_events(topic);
  `);
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

export function insertIntelligenceEvent(event: IntelligenceEvent) {
  const database = getDb();
  const stmt = database.prepare(`INSERT OR REPLACE INTO intelligence_events(
    id, topic, timestamp, source, channel, parent_id, tags, payload, meta, causal_chain
  ) VALUES (@id, @topic, @timestamp, @source, @channel, @parent_id, @tags, @payload, @meta, @causal_chain)`);
  stmt.run({
    id: event.id,
    topic: event.topic,
    timestamp: event.timestamp,
    source: event.source,
    channel: event.channel,
    parent_id: event.causal?.parent?.id ?? null,
    tags: event.tags ? JSON.stringify(event.tags) : null,
    payload: JSON.stringify(event.payload),
    meta: JSON.stringify(event.meta),
    causal_chain: event.causal?.chain ? JSON.stringify(event.causal.chain) : null,
  });
}

export function listIntelligenceEvents(limit: number) {
  const database = getDb();
  const stmt = database.prepare(`SELECT * FROM intelligence_events ORDER BY timestamp DESC LIMIT ?`);
  const rows = stmt.all(limit) as {
    id: string;
    topic: string;
    timestamp: string;
    source: string;
    channel: IntelligenceEvent['channel'];
    parent_id: string | null;
    tags: string | null;
    payload: string;
    meta: string;
    causal_chain: string | null;
  }[];
  return rows.map(row => ({
    id: row.id,
    topic: row.topic,
    timestamp: row.timestamp,
    source: row.source,
    channel: row.channel,
    payload: JSON.parse(row.payload),
    tags: row.tags ? JSON.parse(row.tags) : undefined,
    causal: {
      parent: row.parent_id ? { id: row.parent_id } : undefined,
      chain: row.causal_chain ? JSON.parse(row.causal_chain) : undefined,
    },
    meta: JSON.parse(row.meta),
  }) as IntelligenceEvent[]);
}

export function getHydrationEvents(limit: number) {
  const database = getDb();
  const stmt = database.prepare(`SELECT * FROM intelligence_events ORDER BY timestamp ASC LIMIT ?`);
  const rows = stmt.all(limit) as {
    id: string;
    topic: string;
    timestamp: string;
    source: string;
    channel: IntelligenceEvent['channel'];
    parent_id: string | null;
    tags: string | null;
    payload: string;
    meta: string;
    causal_chain: string | null;
  }[];
  return rows.map(row => ({
    id: row.id,
    topic: row.topic,
    timestamp: row.timestamp,
    source: row.source,
    channel: row.channel,
    payload: JSON.parse(row.payload),
    tags: row.tags ? JSON.parse(row.tags) : undefined,
    causal: {
      parent: row.parent_id ? { id: row.parent_id } : undefined,
      chain: row.causal_chain ? JSON.parse(row.causal_chain) : undefined,
    },
    meta: JSON.parse(row.meta),
  }) as IntelligenceEvent[]);
}
