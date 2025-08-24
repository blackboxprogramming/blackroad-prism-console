const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || '/srv/watcher-bot/watcher.db';
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const database = new Database(DB_PATH);

database.pragma('journal_mode = WAL');

database.exec(`CREATE TABLE IF NOT EXISTS checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER,
  component TEXT,
  ok INTEGER,
  latency_ms INTEGER,
  message TEXT
);
CREATE TABLE IF NOT EXISTS incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  opened_ts INTEGER,
  closed_ts INTEGER,
  component TEXT,
  severity TEXT,
  summary TEXT,
  status TEXT,
  acked_by TEXT
);
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER,
  channel TEXT,
  ref TEXT,
  message TEXT
);
CREATE TABLE IF NOT EXISTS metrics_rollup (
  day TEXT,
  metric TEXT,
  p50 REAL,
  p95 REAL,
  p99 REAL,
  count INTEGER,
  PRIMARY KEY(day,metric)
);
`);

function logCheck(c){
  database.prepare('INSERT INTO checks (ts,component,ok,latency_ms,message) VALUES (?,?,?,?,?)')
    .run(Date.now(), c.component, c.ok?1:0, c.latency_ms||0, c.message||'');
}

function listIncidents(){
  return database.prepare('SELECT * FROM incidents ORDER BY opened_ts DESC LIMIT 100').all();
}

function openIncident(component,severity,summary){
  database.prepare('INSERT INTO incidents (opened_ts,component,severity,summary,status) VALUES (?,?,?,?,?)')
    .run(Date.now(),component,severity,summary,'open');
}

function getOpenIncident(component){
  return database.prepare('SELECT * FROM incidents WHERE component=? AND status="open"').get(component);
}

function ackIncident(id){
  database.prepare('UPDATE incidents SET status="acked" WHERE id=?').run(id);
}

function closeIncident(id){
  database.prepare('UPDATE incidents SET status="closed", closed_ts=? WHERE id=?').run(Date.now(),id);
}

function getMetrics(range){
  // simple placeholder: return last checks
  const since = Date.now() - 24*3600*1000;
  return database.prepare('SELECT * FROM checks WHERE ts > ?').all(since);
}

module.exports = { db: database, logCheck, listIncidents, openIncident, getOpenIncident, ackIncident, closeIncident, getMetrics };
