const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'audit.db'));
db.exec(`CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  action TEXT,
  success INTEGER,
  timestamp TEXT
)`);

function logAudit(userId, action, success) {
  const stmt = db.prepare('INSERT INTO audit_logs (user_id, action, success, timestamp) VALUES (?, ?, ?, ?)');
  stmt.run(userId, action, success ? 1 : 0, new Date().toISOString());
}

function getAuditLogs() {
  return db.prepare('SELECT user_id, action, success, timestamp FROM audit_logs ORDER BY id DESC').all();
}

module.exports = { logAudit, getAuditLogs };
