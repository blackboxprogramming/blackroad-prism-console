'use strict';

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Database = require('better-sqlite3');
const migrate = require('./migrate');

const DB_FILE =
  process.env.NODE_ENV === 'test'
    ? '/tmp/blackroad_test.db'
    : '/srv/blackroad-api/blackroad.db';

// Ensure database and schema are ready
migrate();

// Simple connection pool (single connection reused)
const pool = [];
function getDb() {
  if (pool.length === 0) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    const db = new Database(DB_FILE);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    pool.push(db);
  }
  return pool[0];
}

function closeDb() {
  if (pool[0]) {
    pool[0].close();
    pool.length = 0;
  }
}

// ---- Users ----
function addUser(email, passwordHash) {
  const id = uuidv4();
  getDb()
    .prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)')
    .run(id, email, passwordHash);
  return id;
}

function getUsers() {
  return getDb().prepare('SELECT id, email, password_hash, created_at FROM users').all();
}

// ---- Projects ----
function addProject(userId, name) {
  const id = uuidv4();
  getDb()
    .prepare('INSERT INTO projects (id, user_id, name) VALUES (?, ?, ?)')
    .run(id, userId, name);
  return getProject(id);
}

function getProject(id) {
  return getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

function getProjects(userId) {
  return getDb().prepare('SELECT * FROM projects WHERE user_id = ?').all(userId);
}
const bcrypt = require('bcrypt');

const demoProjectId = uuidv4();

const store = {
  users: [
    {
      id: 'u-admin',
      username: 'admin',
      passwordHash: bcrypt.hashSync('adminpass', 10),
      role: 'admin',
      created_at: new Date().toISOString(),
      projectId: demoProjectId
    }
  ],
  sessions: [],
  wallet: { rc: 1.2 },
    agents: [
      { id: 'phi', name: 'Phi', status: 'idle', cpu: 0, memory: 0, location: 'local' },
      { id: 'gpt', name: 'GPT', status: 'idle', cpu: 0, memory: 0, location: 'cloud' },
      { id: 'mistral', name: 'Mistral', status: 'idle', cpu: 0, memory: 0, location: 'cloud' }
    ],
  contradictions: { issues: 2 },
  sessionNotes: "",
  guardian: {
    status: { secure: true, mfa: true, encryption: true, lastScan: '2025-08-20' },
    alerts: [
      { id: uuidv4(), type: 'Unauthorized login', severity: 'high', time: new Date().toISOString(), status: 'active' }
    ]
  },
  posts: [
    {
      id: uuidv4(),
      author: 'Admin',
      time: new Date().toISOString(),
      content: 'Welcome to BackRoad!\n\nShare updates with your fellow travelers.',
      likes: 0,
    },
  ],
  tasks: [
    { id: uuidv4(), projectId: demoProjectId, title: "Calculus HW 3", course: "Math 201", status: "todo", due: "2025-08-25", reward: 12, progress: 0.2 },
    { id: uuidv4(), projectId: demoProjectId, title: "Lab: Sorting", course: "CS 101", status: "inprogress", due: "2025-08-23", reward: 20, progress: 0.55 },
    { id: uuidv4(), projectId: demoProjectId, title: "Essay Draft", course: "ENG 210", status: "review", due: "2025-08-24", reward: 15, progress: 0.8 },
    { id: uuidv4(), projectId: demoProjectId, title: "Fix auth bug", course: "CS 101", status: "done", due: "2025-08-21", reward: 5, progress: 1.0 }
  ],
  commits: [
    { id: 'c1', hash: 'd1f6e52', author: 'Mistral agent', message: 'Revert last commit', time: new Date(Date.now()-3600e3).toISOString() },
    { id: 'c2', hash: 'a9c1b02', author: 'User', message: 'Add print("Hello, world!")', time: new Date(Date.now()-1800e3).toISOString() }
  ],
  projects: [
    { id: demoProjectId, name: 'Demo Project', status: 'active' }
  ],
  timeline: [
    { id: uuidv4(), type: 'agent', agent: 'Phi', text: "created a branch `main`", time: new Date().toISOString() },
    { id: uuidv4(), type: 'agent', agent: 'GPT', text: "ran a code generation (env: prod, branch: main)", time: new Date().toISOString() },
  ],
  lucidiaHistory: [],
  claudeHistory: [],
  codexRuns: []
};

// ---- Tasks ----
function addTask(projectId, title, status = 'todo') {
  const id = uuidv4();
  getDb()
    .prepare('INSERT INTO tasks (id, project_id, title, status) VALUES (?, ?, ?, ?)')
    .run(id, projectId, title, status);
  return getTask(id);
}

function getTask(id) {
  return getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

function getTasks(projectId) {
  return getDb()
    .prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC')
    .all(projectId);
}

function getAllTasks() {
  return getDb().prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
}

function updateTask(id, fields) {
  const { title, status } = fields || {};
  getDb()
    .prepare(
      `UPDATE tasks SET title = COALESCE(?, title), status = COALESCE(?, status), updated_at = datetime('now') WHERE id = ?`
    )
    .run(title || null, status || null, id);
  return getTask(id);
}

function deleteTask(id) {
  getDb().prepare('DELETE FROM tasks WHERE id = ?').run(id);
}

// ---- Logs ----
function addLog(service, message) {
  getDb().prepare('INSERT INTO logs (service, message) VALUES (?, ?)').run(service, message);
}

function getLogs() {
  return getDb().prepare('SELECT * FROM logs ORDER BY timestamp DESC').all();
}

// ---- Contradictions ----
function addContradiction(module, description) {
  getDb()
    .prepare('INSERT INTO contradictions (module, description) VALUES (?, ?)')
    .run(module, description);
}

function getContradictions() {
  return getDb()
    .prepare('SELECT * FROM contradictions ORDER BY timestamp DESC')
    .all();
}

function deleteContradiction(id) {
  return getDb().prepare('DELETE FROM contradictions WHERE id = ?').run(id);
}

function mapException(row) {
  if (!row) return null;
  return {
    id: row.id,
    rule_id: row.rule_id,
    org_id: row.org_id,
    subject_type: row.subject_type,
    subject_id: row.subject_id,
    requested_by: row.requested_by,
    reason: row.reason,
    status: row.status,
    valid_from: row.valid_from,
    valid_until: row.valid_until,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function recordExceptionEvent(exceptionId, actor, action, note, at) {
  const db = getDb();
  db.prepare(
    'INSERT INTO exception_events (exception_id, at, actor, action, note) VALUES (?, ?, ?, ?, ?)',
  ).run(exceptionId, at || new Date().toISOString(), actor, action, note || null);
}

function createException(entry) {
  const {
    ruleId,
    orgId,
    subjectType,
    subjectId,
    requestedBy,
    reason,
    validFrom = null,
    validUntil = null,
  } = entry;
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO exceptions (rule_id, org_id, subject_type, subject_id, requested_by, reason, status, valid_from, valid_until)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
    )
    .run(ruleId, orgId, subjectType, subjectId, requestedBy, reason, validFrom, validUntil);
  const id = info.lastInsertRowid;
  recordExceptionEvent(id, requestedBy, 'request', reason);
  return getException(id);
}

function getException(id) {
  const row = getDb().prepare('SELECT * FROM exceptions WHERE id = ?').get(id);
  return mapException(row);
}

function listExceptions(filters = {}) {
  const clauses = [];
  const params = [];
  if (filters.ruleId) {
    clauses.push('rule_id = ?');
    params.push(filters.ruleId);
  }
  if (filters.subjectType) {
    clauses.push('subject_type = ?');
    params.push(filters.subjectType);
  }
  if (filters.subjectId) {
    clauses.push('subject_id = ?');
    params.push(filters.subjectId);
  }
  if (filters.status) {
    clauses.push('status = ?');
    params.push(filters.status);
  }
  const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
  const rows = getDb()
    .prepare(`SELECT * FROM exceptions${where} ORDER BY created_at DESC`)
    .all(...params);
  return rows.map(mapException).filter(Boolean);
}

function approveException(id, options) {
  const exception = getException(id);
  if (!exception) return null;
  const actor = options.actor;
  const note = options.note || null;
  const validFrom = options.valid_from || options.validFrom || new Date().toISOString();
  const validUntil = options.valid_until || options.validUntil || null;
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE exceptions
       SET status='approved', valid_from = ?, valid_until = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(validFrom, validUntil, now, id);
  recordExceptionEvent(id, actor, 'approve', note, now);
  return getException(id);
}

function denyException(id, options) {
  const exception = getException(id);
  if (!exception) return null;
  const actor = options.actor;
  const note = options.note || null;
  const now = new Date().toISOString();
  getDb()
    .prepare(`UPDATE exceptions SET status='denied', updated_at = ? WHERE id = ?`)
    .run(now, id);
  recordExceptionEvent(id, actor, 'deny', note, now);
  return getException(id);
}

function revokeException(id, options) {
  const exception = getException(id);
  if (!exception) return null;
  const actor = options.actor;
  const note = options.note || null;
  const now = new Date().toISOString();
  getDb()
    .prepare(`UPDATE exceptions SET status='revoked', updated_at = ? WHERE id = ?`)
    .run(now, id);
  recordExceptionEvent(id, actor, 'revoke', note, now);
  return getException(id);
}

function expireApprovedExceptions(now = new Date()) {
  const db = getDb();
  const cutoff = new Date(now).toISOString();
  const ids = db
    .prepare(
      `SELECT id FROM exceptions
       WHERE status='approved' AND valid_until IS NOT NULL AND datetime(valid_until) < datetime(?)`
    )
    .all(cutoff)
    .map((row) => row.id);
  if (!ids.length) return 0;
  const update = db.prepare(`UPDATE exceptions SET status='expired', updated_at = ? WHERE id = ?`);
  const insert = db.prepare(
    `INSERT INTO exception_events (exception_id, at, actor, action, note) VALUES (?, ?, ?, 'expire', NULL)`
  );
  const tx = db.transaction((exceptionId) => {
    update.run(cutoff, exceptionId);
    insert.run(exceptionId, cutoff, 0);
  });
  ids.forEach((id) => tx(id));
  return ids.length;
}

module.exports = {
  getDb,
  closeDb,
  addUser,
  getUsers,
  addProject,
  getProject,
  getProjects,
  addTask,
  getTask,
  getTasks,
  getAllTasks,
  updateTask,
  deleteTask,
  addLog,
  getLogs,
  addContradiction,
  getContradictions,
  deleteContradiction,
  createException,
  getException,
  listExceptions,
  approveException,
  denyException,
  revokeException,
  expireApprovedExceptions,
};

