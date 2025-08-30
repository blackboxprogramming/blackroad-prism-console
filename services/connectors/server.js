import express from 'express';
import fs from 'fs';
import { dirname, resolve } from 'path';
import { exec } from 'child_process';

const app = express();
app.use(express.json({ limit: '10mb' }));

const CONNECTOR_KEY = process.env.CONNECTOR_KEY;
if (!CONNECTOR_KEY) {
  throw new Error('CONNECTOR_KEY is required');
}
const LOG_FILE = '/var/log/blackroad-connectors.log';

function log(line) {
  const entry = `${new Date().toISOString()} ${line}\n`;
  fs.appendFileSync(LOG_FILE, entry);
}

function authorize(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token !== CONNECTOR_KEY) {
    log(`denied ${req.path}`);
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }
  next();
}

function validPath(p) {
  const full = resolve(p);
  return full.startsWith('/srv/') || full.startsWith('/var/www/blackroad/');
}

app.use(authorize);

app.post('/connectors/paste', (req, res) => {
  const { path, content } = req.body || {};
  if (!path || !validPath(path)) return res.status(400).json({ ok: false });
  fs.mkdirSync(dirname(path), { recursive: true });
  fs.writeFileSync(path, content ?? '');
  log(`paste ${path}`);
  res.json({ ok: true });
});

app.post('/connectors/append', (req, res) => {
  const { path, content } = req.body || {};
  if (!path || !validPath(path)) return res.status(400).json({ ok: false });
  fs.appendFileSync(path, content ?? '');
  log(`append ${path}`);
  res.json({ ok: true });
});

app.post('/connectors/replace', (req, res) => {
  const { path, find, replace } = req.body || {};
  if (!path || !validPath(path)) return res.status(400).json({ ok: false });
  let data = fs.readFileSync(path, 'utf8');
  data = data.split(find ?? '').join(replace ?? '');
  fs.writeFileSync(path, data);
  log(`replace ${path}`);
  res.json({ ok: true });
});

app.post('/connectors/restart', (req, res) => {
  const { service } = req.body || {};
  if (!service) return res.status(400).json({ ok: false });
  exec(`systemctl restart ${service}`, (err) => {
    log(`restart ${service} ${err ? 'fail' : 'ok'}`);
  });
  res.json({ ok: true });
});

app.post('/connectors/build', (req, res) => {
  const { cwd, cmd } = req.body || {};
  if (!cwd || !validPath(cwd)) return res.status(400).json({ ok: false });
  const command = cmd || 'npm install && npm run build';
  exec(command, { cwd }, (err, stdout, stderr) => {
    log(`build ${cwd} ${err ? 'fail' : 'ok'}`);
    fs.appendFileSync(LOG_FILE, stdout + stderr);
  });
  res.json({ ok: true });
});

const PORT = process.env.PORT || 9000;
app.listen(PORT, '0.0.0.0', () => {
  log(`connectors listening on ${PORT}`);
});
