import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 4010;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const LOG_DIR = '/var/log/blackroad';
const LOG_FILE = path.join(LOG_DIR, 'ollama-bridge.log');
const PERSONA_LOG = path.join(LOG_DIR, 'persona.log');
const PERSONA_FILE = path.join(__dirname, '.persona');
const MODEL_FILE = path.join(__dirname, '.model');
const DEFAULT_PERSONA = process.env.DEFAULT_PERSONA || '';

fs.mkdirSync(LOG_DIR, { recursive: true, mode: 0o750 });
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
const personaStream = fs.createWriteStream(PERSONA_LOG, { flags: 'a' });

function logLine(obj) {
  logStream.write(JSON.stringify(obj) + '\n');
}

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

// Persona baseline
let personaMode = process.env.PERSONA_GUARD === 'enforce' ? 'enforce' : 'warn';
let personaHash;
try {
  personaHash = fs.readFileSync(PERSONA_FILE, 'utf8').trim();
  if (!personaHash) throw new Error('empty');
} catch {
  personaHash = sha256(DEFAULT_PERSONA);
  fs.writeFileSync(PERSONA_FILE, personaHash, { mode: 0o600 });
  personaMode = 'warn';
}
const personaAllow = process.env.PERSONA_ALLOW_HASH || '';

function resolveModel() {
  try {
    return process.env.MODEL || fs.readFileSync(MODEL_FILE, 'utf8').trim();
  } catch {
    return process.env.MODEL || '';
  }
}

const buckets = [5,10,25,50,100,250,500,1000,2500];
class Histogram {
  constructor() {
    this.counts = Array(buckets.length).fill(0);
    this.sum = 0;
    this.count = 0;
  }
  observe(v) {
    this.count++;
    this.sum += v;
    for (let i=0;i<buckets.length;i++) {
      if (v <= buckets[i]) this.counts[i]++;
    }
  }
  lines(name, labels) {
    const out = [];
    for (let i=0;i<buckets.length;i++) {
      out.push(`${name}_bucket{${labels},le="${buckets[i]}"} ${this.counts[i]}`);
    }
    out.push(`${name}_bucket{${labels},le="+Inf"} ${this.count}`);
    out.push(`${name}_sum{${labels}} ${this.sum}`);
    out.push(`${name}_count{${labels}} ${this.count}`);
    return out;
  }
}

class Metrics {
  constructor() {
    this.reqTotals = {};
    this.reqHists = {};
    this.upHists = {};
    this.sseClients = 0;
    this.authDenied = 0;
    this.rateLimited = 0;
  }
  record(path, method, code, dur, up) {
    const key = `${path}|${method}|${code}`;
    this.reqTotals[key] = (this.reqTotals[key] || 0) + 1;
    if (!this.reqHists[key]) this.reqHists[key] = new Histogram();
    this.reqHists[key].observe(dur);
    if (up !== undefined) {
      if (!this.upHists[key]) this.upHists[key] = new Histogram();
      this.upHists[key].observe(up);
    }
  }
  incSSE(delta) { this.sseClients += delta; }
  incAuthDenied() { this.authDenied++; }
  incRateLimited() { this.rateLimited++; }
  render() {
    let out = '# HELP http_requests_total Count of HTTP requests\n';
    out += '# TYPE http_requests_total counter\n';
    for (const key of Object.keys(this.reqTotals)) {
      const [path, method, code] = key.split('|');
      out += `http_requests_total{path="${path}",method="${method}",code="${code}"} ${this.reqTotals[key]}\n`;
    }
    out += '# HELP http_request_duration_ms Duration of HTTP requests\n';
    out += '# TYPE http_request_duration_ms histogram\n';
    for (const key of Object.keys(this.reqHists)) {
      const [path, method, code] = key.split('|');
      out += this.reqHists[key].lines('http_request_duration_ms', `path="${path}",method="${method}",code="${code}"`).join('\n') + '\n';
    }
    out += '# HELP upstream_duration_ms Duration of upstream requests\n';
    out += '# TYPE upstream_duration_ms histogram\n';
    for (const key of Object.keys(this.upHists)) {
      const [path, method, code] = key.split('|');
      out += this.upHists[key].lines('upstream_duration_ms', `path="${path}",method="${method}",code="${code}"`).join('\n') + '\n';
    }
    out += '# HELP sse_clients_gauge Number of connected SSE clients\n';
    out += '# TYPE sse_clients_gauge gauge\n';
    out += `sse_clients_gauge ${this.sseClients}\n`;
    out += '# HELP auth_denied_total Auth denied count\n';
    out += '# TYPE auth_denied_total counter\n';
    out += `auth_denied_total ${this.authDenied}\n`;
    out += '# HELP rate_limited_total Rate limited count\n';
    out += '# TYPE rate_limited_total counter\n';
    out += `rate_limited_total ${this.rateLimited}\n`;
    return out;
  }
}

const metrics = new Metrics();

const app = express();
app.use(express.json());

// Request logger + metrics
app.use((req, res, next) => {
  const reqId = crypto.randomUUID();
  req.reqId = reqId;
  const t0 = process.hrtime.bigint();
  const bytesIn = parseInt(req.get('content-length') || '0', 10);
  res.setHeader('X-Request-ID', reqId);
  let bytesOut = 0;
  const origWrite = res.write;
  const origEnd = res.end;
  res.write = function (chunk, enc, cb) {
    if (chunk) bytesOut += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk, enc);
    return origWrite.call(this, chunk, enc, cb);
  };
  res.end = function (chunk, enc, cb) {
    if (chunk) bytesOut += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk, enc);
    return origEnd.call(this, chunk, enc, cb);
  };
  res.on('finish', () => {
    const dur = Number(process.hrtime.bigint() - t0) / 1e6;
    metrics.record(req.path, req.method, res.statusCode, dur, res.locals.up_ms);
    const entry = {
      ts: new Date().toISOString(),
      req_id: reqId,
      ip: req.ip,
      method: req.method,
      path: req.path,
      code: res.statusCode,
      dur_ms: Number(dur.toFixed(1)),
      up_ms: res.locals.up_ms ? Number(res.locals.up_ms.toFixed(1)) : undefined,
      bytes_in: bytesIn,
      bytes_out: bytesOut,
      model: res.locals.model
    };
    logLine(entry);
  });
  next();
});

// Persona guard helper
function personaCheck(system, req) {
  const current = sha256(system || DEFAULT_PERSONA);
  if (current !== personaHash) {
    const event = { ts: new Date().toISOString(), level: 'warn', kind: 'persona_diff', req_id: req.reqId, hash: current, baseline: personaHash };
    if (personaMode === 'enforce' && current !== personaAllow) {
      logLine({ ...event, level: 'error' });
      personaStream.write(`${event.ts} enforce ${event.baseline}->${event.hash}\n`);
      return { ok: false };
    }
    logLine(event);
    personaStream.write(`${event.ts} warn ${event.baseline}->${event.hash}\n`);
    if (personaMode === 'enforce' && current === personaAllow) {
      personaHash = current;
      fs.writeFileSync(PERSONA_FILE, personaHash, { mode: 0o600 });
    }
  }
  return { ok: true };
}

let lastHealth = 0;

async function fetchJSON(url, opts) {
  const t = process.hrtime.bigint();
  const r = await fetch(url, opts);
  const up = Number(process.hrtime.bigint() - t) / 1e6;
  return { r, up };
}

app.get('/api/llm/health', async (req, res) => {
  try {
    const { r, up } = await fetchJSON(`${OLLAMA_URL}/api/version`);
    res.locals.up_ms = up;
    if (!r.ok) throw new Error('upstream');
    const data = await r.json();
    lastHealth = Date.now();
    res.json({ ok: true, version: data.version });
  } catch {
    res.status(502).json({ ok: false });
  }
});

app.post('/api/llm/chat', async (req, res) => {
  const system = req.body?.system || DEFAULT_PERSONA;
  const check = personaCheck(system, req);
  if (!check.ok) return res.status(409).json({ error: 'persona changed' });
  const body = { ...req.body, system, model: req.body?.model || resolveModel() };
  res.locals.model = body.model;
  try {
    const { r, up } = await fetchJSON(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    res.locals.up_ms = up;
    const txt = await r.text();
    res.status(r.status).type(r.headers.get('content-type') || 'text/plain').send(txt);
  } catch {
    res.status(502).json({ error: 'upstream_error' });
  }
});

app.post('/api/llm/stream', async (req, res) => {
  const system = req.body?.system || DEFAULT_PERSONA;
  const check = personaCheck(system, req);
  if (!check.ok) return res.status(409).json({ error: 'persona changed' });
  const body = { ...req.body, system, model: req.body?.model || resolveModel() };
  res.locals.model = body.model;
  metrics.incSSE(1);
  res.on('close', () => metrics.incSSE(-1));
  try {
    const { r, up } = await fetchJSON(`${OLLAMA_URL}/api/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    res.locals.up_ms = up;
    if (!r.body) {
      const txt = await r.text();
      return res.status(r.status).type('text/plain').send(txt);
    }
    res.status(r.status);
    for await (const chunk of r.body) {
      res.write(chunk);
    }
    res.end();
  } catch {
    res.status(502).json({ error: 'upstream_error' });
  }
});

app.get('/api/llm/models', async (req, res) => {
  try {
    const { r, up } = await fetchJSON(`${OLLAMA_URL}/api/tags`);
    res.locals.up_ms = up;
    const data = await r.json();
    res.json(data);
  } catch {
    res.status(502).json({ error: 'upstream_error' });
  }
});

app.get('/api/llm/default', (req, res) => {
  res.json({ model: resolveModel() });
});

app.get('/api/llm/metrics', (req, res) => {
  res.type('text/plain; version=0.0.4').send(metrics.render());
});

app.get('/api/llm/persona', (req, res) => {
  res.json({ hash: personaHash, mode: personaMode });
});

app.post('/api/llm/persona', (req, res) => {
  const { hash, mode } = req.body || {};
  if (hash) {
    personaHash = hash;
    fs.writeFileSync(PERSONA_FILE, personaHash, { mode: 0o600 });
  }
  if (mode) personaMode = mode === 'enforce' ? 'enforce' : 'warn';
  res.json({ hash: personaHash, mode: personaMode });
});

async function readyCheck() {
  const reasons = [];
  try {
    const { r } = await fetchJSON(`${OLLAMA_URL}/api/version`);
    if (!r.ok) reasons.push('ollama_unreachable');
  } catch {
    reasons.push('ollama_unreachable');
  }
  const model = resolveModel();
  if (model) {
    try {
      const { r } = await fetchJSON(`${OLLAMA_URL}/api/tags`);
      const data = await r.json();
      if (!data.models?.some(m => m.name === model)) reasons.push('model_missing');
    } catch {
      reasons.push('model_missing');
    }
  } else {
    reasons.push('model_missing');
  }
  try {
    const testPath = path.join(LOG_DIR, '.ready');
    fs.writeFileSync(testPath, Date.now().toString());
    fs.unlinkSync(testPath);
  } catch {
    reasons.push('log_dir_unwritable');
  }
  if (Date.now() - lastHealth > 30000) {
    try {
      const { r } = await fetchJSON(`${OLLAMA_URL}/api/version`);
      if (r.ok) lastHealth = Date.now();
      else reasons.push('health_stale');
    } catch {
      reasons.push('health_stale');
    }
  }
  return reasons;
}

app.get('/api/llm/ready', async (req, res) => {
  const reasons = await readyCheck();
  if (reasons.length === 0) return res.json({ ok: true });
  res.status(503).json({ ok: false, reasons });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ollama-bridge listening on ${PORT}`);
});
