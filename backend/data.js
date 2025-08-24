'use strict';

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Database = require('better-sqlite3');
const migrate = require('./migrate');

const DB_FILE = '/srv/blackroad-api/blackroad.db';

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
};

