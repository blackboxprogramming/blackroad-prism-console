'use strict';

const fs = require('fs');
const path = require('path');

let Database;
let databaseLoadError;
try {
  Database = require('better-sqlite3');
} catch (error) {
  databaseLoadError = error;
}

function ensureDirectory(targetPath) {
  const dir = path.dirname(targetPath);
  fs.mkdirSync(dir, { recursive: true });
}

class MemoryStore {
  constructor(dbPath) {
    if (!Database) {
      const message = 'better-sqlite3 is not installed. MemoryStore cannot be constructed.';
      const error = new Error(message);
      error.cause = databaseLoadError;
      throw error;
    }

    this.dbPath = dbPath;
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
      count: this.db.prepare(`SELECT COUNT(*) as total FROM memories`),
      lastInserted: this.db.prepare(`SELECT created_at FROM memories ORDER BY id DESC LIMIT 1`),
      search: this.db.prepare(
        `SELECT m.*, bm25(memories_fts) AS score
         FROM memories_fts f
         JOIN memories m ON m.id = f.rowid
         WHERE memories_fts MATCH ?
         ORDER BY score
         LIMIT ?`
      ),
      listRecent: this.db.prepare(`SELECT * FROM memories ORDER BY created_at DESC LIMIT ?`),
    };
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
    if (!query || typeof query !== 'string') {
      return [];
    }

    const normalizedLimit = Number.isFinite(limit) ? Math.max(1, Math.min(100, Math.floor(limit))) : 10;
    const rows = this.statements.search.all(query, normalizedLimit);
    return rows.map((row) => this.#mapRow(row));
  }

  listRecent(limit = 20) {
    const normalizedLimit = Number.isFinite(limit) ? Math.max(1, Math.min(100, Math.floor(limit))) : 20;
    const rows = this.statements.listRecent.all(normalizedLimit);
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

  #mapRow(row) {
    if (!row) {
      return null;
    }

    let tags = [];
    if (row.tags) {
      try {
        const parsed = JSON.parse(row.tags);
        if (Array.isArray(parsed)) {
          tags = parsed;
        }
      } catch (error) {
        tags = [];
      }
    }

    return {
      id: row.id,
      text: row.text,
      source: row.source,
      tags,
      created_at: row.created_at,
      score: row.score,
    };
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = {
  MemoryStore,
};
