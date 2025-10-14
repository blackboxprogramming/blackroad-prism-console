import Database from 'better-sqlite3';
import { EventEmitter } from 'events';
import { GraphNode, GraphEdge } from '../types';

export class GraphStore extends EventEmitter {
  db: Database;
  constructor() {
    super();
    this.db = new Database(':memory:');
    this.init();
  }
  init() {
    this.db.exec(`CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      projectId TEXT,
      kind TEXT,
      label TEXT,
      attrs TEXT,
      updatedAt TEXT
    );`);
    this.db.exec(`CREATE TABLE IF NOT EXISTS links (
      id TEXT PRIMARY KEY,
      projectId TEXT,
      fromId TEXT,
      toId TEXT,
      kind TEXT,
      attrs TEXT,
      updatedAt TEXT
    );`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_res_proj ON resources(projectId);`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_res_proj_kind ON resources(projectId, kind);`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_links_proj ON links(projectId);`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_links_proj_from_to ON links(projectId, fromId, toId);`);
  }
  upsertResource(projectId: string, id: string, kind: string, label: string, attrs: any) {
    const stmt = this.db.prepare(`INSERT INTO resources(id, projectId, kind, label, attrs, updatedAt)
      VALUES(@id,@projectId,@kind,@label,@attrs,@updatedAt)
      ON CONFLICT(id) DO UPDATE SET label=@label, attrs=@attrs, updatedAt=@updatedAt`);
    stmt.run({ id, projectId, kind, label, attrs: JSON.stringify(attrs || {}), updatedAt: new Date().toISOString() });
    this.emit('node', projectId, { id, kind, label, attrs });
  }
  upsertLink(projectId: string, id: string, fromId: string, toId: string, kind: string, attrs: any) {
    const stmt = this.db.prepare(`INSERT INTO links(id, projectId, fromId, toId, kind, attrs, updatedAt)
      VALUES(@id,@projectId,@fromId,@toId,@kind,@attrs,@updatedAt)
      ON CONFLICT(id) DO UPDATE SET attrs=@attrs, updatedAt=@updatedAt`);
    stmt.run({ id, projectId, fromId, toId, kind, attrs: JSON.stringify(attrs || {}), updatedAt: new Date().toISOString() });
    this.emit('edge', projectId, { id, from: fromId, to: toId, kind, attrs });
  }
  ingest(projectId: string, event: any) {
    if (event.type === 'run.start') {
      this.upsertResource(projectId, `process:${event.runId}`, 'process', event.runId, { cmd: event.cmd, cwd: event.cwd });
    } else if (event.type === 'run.end') {
      this.upsertResource(projectId, `process:${event.runId}`, 'process', event.runId, { status: event.status, exitCode: event.exitCode });
    } else if (event.type === 'file.write') {
      this.upsertResource(projectId, `file:${event.path}`, 'file', event.path, {});
      const from = event.runId ? `process:${event.runId}` : `process:unknown`;
      this.upsertResource(projectId, from, 'process', from.split(':')[1], {});
      this.upsertLink(projectId, `link:${from}->file:${event.path}`, from, `file:${event.path}`, 'writes', {});
    }
  }
  getGraph(projectId: string) {
    const nodes = this.db.prepare(`SELECT * FROM resources WHERE projectId=?`).all(projectId).map(r => ({ id: r.id, kind: r.kind, label: r.label, attrs: JSON.parse(r.attrs) } as GraphNode));
    const edges = this.db.prepare(`SELECT * FROM links WHERE projectId=?`).all(projectId).map(r => ({ id: r.id, from: r.fromId, to: r.toId, kind: r.kind, attrs: JSON.parse(r.attrs) } as GraphEdge));
    return { nodes, edges };
  }
  rebuild(_projectId: string) {
    // in-memory, nothing to rebuild
  }
}

export const graphStore = new GraphStore();
