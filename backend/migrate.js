// Simple migration stub
const Database = require('better-sqlite3');
const db = new Database('prism.db');

// TODO: create tables
const schema = `
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT, password_hash TEXT);
CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, user_id TEXT, name TEXT);
CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, project_id TEXT, title TEXT, status TEXT);
CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, service TEXT, message TEXT);
CREATE TABLE IF NOT EXISTS contradictions (id INTEGER PRIMARY KEY AUTOINCREMENT, detail TEXT);
CREATE TABLE IF NOT EXISTS novelty_archive (id INTEGER PRIMARY KEY AUTOINCREMENT, entry TEXT);
CREATE TABLE IF NOT EXISTS symphonies (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT);
`;

db.exec(schema);
module.exports = () => {};
