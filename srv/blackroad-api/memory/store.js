const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

const DEFAULT_MEMORY_DB_PATH = '/srv/blackroad-api/memory.db';

function serialiseTags(tags) {
  if (tags == null) return null;
  if (Array.isArray(tags)) {
    return JSON.stringify(tags.map(tag => String(tag)));
  }
  if (typeof tags === 'string') {
    return JSON.stringify([tags]);
  }
  return JSON.stringify([String(tags)]);
}

function parseTags(tags) {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed.map(tag => String(tag)) : [];
  } catch (err) {
    return [String(tags)];
  }
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function runCallback(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function createMemoryStore(dbPath = DEFAULT_MEMORY_DB_PATH) {
  const resolvedPath = path.resolve(dbPath);
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  const db = new sqlite3.Database(resolvedPath);

  const ready = new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('PRAGMA journal_mode = WAL;');
      db.run('PRAGMA synchronous = NORMAL;');
      const schema = `
        CREATE TABLE IF NOT EXISTS memory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          text TEXT NOT NULL,
          source TEXT DEFAULT 'unknown',
          tags TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_memory_source ON memory(source);
        CREATE INDEX IF NOT EXISTS idx_memory_created ON memory(created_at);

        CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts
          USING fts5(text, content='memory', content_rowid='id');

        CREATE TRIGGER IF NOT EXISTS memory_ai AFTER INSERT ON memory BEGIN
          INSERT INTO memory_fts(rowid, text) VALUES (new.id, new.text);
        END;

        CREATE TRIGGER IF NOT EXISTS memory_ad AFTER DELETE ON memory BEGIN
          INSERT INTO memory_fts(memory_fts, rowid, text) VALUES('delete', old.id, old.text);
        END;

        CREATE TRIGGER IF NOT EXISTS memory_au AFTER UPDATE ON memory BEGIN
          INSERT INTO memory_fts(memory_fts, rowid, text) VALUES('delete', old.id, old.text);
          INSERT INTO memory_fts(rowid, text) VALUES (new.id, new.text);
        END;
      `;

      db.exec(schema, err => {
        if (err) return reject(err);
        db.run("INSERT INTO memory_fts(memory_fts) VALUES ('rebuild')", rebuildErr => {
          if (rebuildErr && rebuildErr.message && !rebuildErr.message.includes('malformed')) {
            // Ignore most rebuild errors (table already synced or busy)
          }
          resolve();
        });
      });
    });
  });

  function normaliseEntry(row) {
    if (!row) return null;
    return {
      id: row.id,
      text: row.text,
      source: row.source || 'unknown',
      tags: parseTags(row.tags),
      created_at: row.created_at,
    };
  }

  async function indexMemory(entry) {
    if (!entry || typeof entry.text !== 'string' || !entry.text.trim()) {
      throw new Error('Entry text is required');
    }
    await ready;
    const source = entry.source ? String(entry.source) : 'unknown';
    const result = await run(
      db,
      'INSERT INTO memory (text, source, tags) VALUES (?, ?, ?)',
      [entry.text.trim(), source, serialiseTags(entry.tags)]
    );
    const row = await get(db, 'SELECT id, text, source, tags, created_at FROM memory WHERE id = ?', [result.lastID]);
    return normaliseEntry(row);
  }

  async function searchMemory({ query = '', limit = 10 }) {
    await ready;
    const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 50));
    if (!query || !query.trim()) {
      const rows = await all(
        db,
        'SELECT id, text, source, tags, created_at FROM memory ORDER BY created_at DESC LIMIT ?',
        [safeLimit]
      );
      return rows.map(normaliseEntry).filter(Boolean);
    }
    const trimmed = query.trim();
    let ftsQuery = trimmed;
    if (!/["*]/.test(trimmed)) {
      ftsQuery = trimmed.split(/\s+/).map(token => `${token}*`).join(' ');
    }
    const rows = await all(
      db,
      `SELECT m.id, m.text, m.source, m.tags, m.created_at
         FROM memory m
         JOIN memory_fts fts ON m.id = fts.rowid
        WHERE memory_fts MATCH ?
        ORDER BY m.created_at DESC
        LIMIT ?`,
      [ftsQuery, safeLimit]
    );
    if (rows.length) {
      return rows.map(normaliseEntry).filter(Boolean);
    }
    const fallback = await all(
      db,
      'SELECT id, text, source, tags, created_at FROM memory ORDER BY created_at DESC LIMIT ?',
      [safeLimit]
    );
    return fallback.map(normaliseEntry).filter(Boolean);
  }

  async function stats() {
    await ready;
    const row = await get(db, 'SELECT COUNT(*) as count FROM memory');
    return { count: row ? row.count : 0, path: resolvedPath };
  }

  function close() {
    return new Promise((resolve, reject) => {
      db.close(err => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  return {
    indexMemory,
    searchMemory,
    stats,
    close,
    ready,
    dbPath: resolvedPath,
  };
}

module.exports = {
  createMemoryStore,
  DEFAULT_MEMORY_DB_PATH,
};
