const { execSync } = require('child_process');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'blackroad.db');
execSync(`sqlite3 ${dbPath} "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT);"`);
console.log('Database initialized');
