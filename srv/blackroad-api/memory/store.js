'use strict';

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DEFAULT_MEMORY_DB_PATH = process.env.MEMORY_DB_PATH || '/srv/blackroad-api/memory.db';

function ensureDirectory(targetPath) {
  const dir = path.dirname(targetPath);
  fs.mkdirSync(dir, { recursive: true });
}

function normaliseLimit(limit, fallback = 10) {
  if (!Number.isFinite(limit)) {
    return fallback;
  }
  return Math.max(1, Math.min(100, Math.floor(limit)));
}

function normaliseTags(raw) {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

class MemoryStore {
  constructor(dbPath = DEFAULT_MEMORY_DB_PATH) {
    this.dbPath = path.resolve(dbPath);
    ensureDirectory(this.dbPath);
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    this.#prepareSchema();
    this.#prepareStatements();
  }

  #prepareSchema() {
    const createMemories = `
      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        source TEXT,
        tags TEXT,
        created_at TEXT NOT NULL
      );
    `;

    const createFts = `
      CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
        text,
        content='memories',
        content_rowid='id'
      );
    `;

    const createTriggerInsert = `
      CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
        INSERT INTO memories_fts(rowid, text) VALUES (new.id, new.text);
      END;
    `;

    const createTriggerDelete = `
      CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
        DELETE FROM memories_fts WHERE rowid = old.id;
      END;
    `;

    const createTriggerUpdate = `
      CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
        UPDATE memories_fts SET text = new.text WHERE rowid = new.id;
      END;
    `;

    this.db.exec(
      [
        createMemories,
        createFts,
        createTriggerInsert,
        createTriggerDelete,
        createTriggerUpdate,
      ].join('\n')
    );
  }

  #prepareStatements() {
    this.statements = {
      insert: this.db.prepare(
        `INSERT INTO memories (text, source, tags, created_at) VALUES (@text, @source, @tags, @created_at)`
      ),
      getById: this.db.prepare(`SELECT * FROM memories WHERE id = ?`),
      count: this.db.prepare(`SELECT COUNT(*) AS total FROM memories`),
      lastInserted: this.db.prepare(`SELECT created_at FROM memories ORDER BY id DESC LIMIT 1`),
      search: this.db.prepare(
        `SELECT m.*, bm25(memories_fts) AS score
         FROM memories_fts f
         JOIN memories m ON m.id = f.rowid
         WHERE memories_fts MATCH ?
         ORDER BY score
         LIMIT ?`
      ),
      listRecent: this.db.prepare(`SELECT * FROM memories ORDER BY datetime(created_at) DESC LIMIT ?`),
    };
  }

  #mapRow(row) {
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      text: row.text,
      source: row.source || 'unknown',
      tags: normaliseTags(row.tags),
      created_at: row.created_at,
      score: row.score ?? null,
    };
  }

  #decorateQuery(query) {
    const trimmed = query.trim();
    if (!trimmed) {
      return '';
    }

    if (/["*]/.test(trimmed)) {
      return trimmed;
    }

    return trimmed
      .split(/\s+/)
      .filter(Boolean)
      .map((token) => `${token}*`)
      .join(' ');
  }

  insertMemory({ text, source = 'unknown', tags = [], created_at = new Date().toISOString() }) {
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error('Text is required to insert a memory');
    }

    const payload = {
      text: text.trim(),
      source: source || 'unknown',
      tags: JSON.stringify(Array.isArray(tags) ? tags : []),
      created_at,
    };

    const info = this.statements.insert.run(payload);
    const row = this.statements.getById.get(info.lastInsertRowid);
    return this.#mapRow(row);
  }

  searchMemories(query, limit = 10) {
    const normalisedLimit = normaliseLimit(limit);

    if (!query || !query.trim()) {
      return this.listRecent(normalisedLimit);
    }

    const decoratedQuery = this.#decorateQuery(query);
    const rows = this.statements.search.all(decoratedQuery, normalisedLimit);

    if (!rows.length) {
      return this.listRecent(normalisedLimit);
    }

    return rows.map((row) => this.#mapRow(row));
  }

  listRecent(limit = 20) {
    const normalisedLimit = normaliseLimit(limit, 20);
    const rows = this.statements.listRecent.all(normalisedLimit);
    return rows.map((row) => this.#mapRow(row));
  }

  getStats() {
    const total = this.statements.count.get().total;
    const lastInsertedRow = this.statements.lastInserted.get();
    return {
      database: this.dbPath,
      total,
      lastInsertedAt: lastInsertedRow ? lastInsertedRow.created_at : null,
    };
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

function createMemoryStore(dbPath = DEFAULT_MEMORY_DB_PATH) {
  return new MemoryStore(dbPath);
}

module.exports = {
  MemoryStore,
  createMemoryStore,
  DEFAULT_MEMORY_DB_PATH,
};
