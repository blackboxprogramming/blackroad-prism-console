const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'blackroad.db');
const migrationsDir = path.join(__dirname, '..', 'migrations');

fs.readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort()
  .forEach((file) => {
    const filePath = path.join(migrationsDir, file);
    execSync(`sqlite3 ${dbPath} ".read ${filePath}"`);
  });

console.log('Migrations applied');

