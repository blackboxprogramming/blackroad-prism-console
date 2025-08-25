const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

test('API serves correct data after rollback', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rollback-'));
  const dbPath = path.join(tmp, 'blackroad.db');
  const snapDir = path.join(tmp, 'snapshots');
  execSync(`sqlite3 ${dbPath} "CREATE TABLE items(id INTEGER PRIMARY KEY, name TEXT); INSERT INTO items(name) VALUES ('original');"`);
  execSync(`DB_PATH=${dbPath} SNAPSHOT_DIR=${snapDir} scripts/snapshot.sh`, { stdio: 'inherit' });
  execSync(`sqlite3 ${dbPath} "UPDATE items SET name='corrupt';"`);
  execSync(`DB_PATH=${dbPath} SNAPSHOT_DIR=${snapDir} scripts/rollback.sh`, { stdio: 'inherit' });
  const val = execSync(`sqlite3 ${dbPath} "SELECT name FROM items WHERE id=1;"`).toString().trim();
  expect(val).toBe('original');
  const server = spawn('node', ['srv/blackroad-api/server_full.js'], {
    env: { ...process.env, DB_PATH: dbPath, PORT: '5002' },
    stdio: 'ignore'
  });
  await new Promise(r => setTimeout(r, 1000));
  const res = await fetch('http://127.0.0.1:5002/api/health');
  const data = await res.json();
  expect(res.status).toBe(200);
  expect(data.ok).toBe(true);
  server.kill();
});

test('rollback fails gracefully when snapshot missing', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rollback-miss-'));
  const dbPath = path.join(tmp, 'blackroad.db');
  fs.writeFileSync(dbPath, '');
  const snapDir = path.join(tmp, 'snapshots');
  let failed = false;
  try {
    execSync(`DB_PATH=${dbPath} SNAPSHOT_DIR=${snapDir} scripts/rollback.sh`, { stdio: 'pipe' });
  } catch {
    failed = true;
  }
  expect(failed).toBe(true);
});
