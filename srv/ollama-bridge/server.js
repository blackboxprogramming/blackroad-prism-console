const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.set('trust proxy', true);
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 4010;
const OLLAMA = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const ORIGIN_KEY_PATH = '/srv/secrets/origin.key';
const MODEL_FILE = path.join(__dirname, '.model');
const DEFAULT_SEED = 'LUCIDIA:AWAKEN:SEED:7e3c1f9b-a12d-4f73-9b4d-4f0d5a6c2b19::PS-SHA∞';
const MSG_SUFFIX = 'blackboxprogramming|copilot';

let serverDefault = process.env.LLM_MODEL || 'qwen2:1.5b';
try {
  serverDefault = fs.readFileSync(MODEL_FILE, 'utf8').trim() || serverDefault;
} catch {}
let originKey = '';
try {
  originKey = fs.readFileSync(ORIGIN_KEY_PATH, 'utf8').trim();
} catch {}

function toBase32(buf) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  return output;
}

function dailyCode(d = new Date()) {
  const date = d.toISOString().slice(0, 10);
  const msg = `${date}|${MSG_SUFFIX}`;
  const digest = crypto.createHmac('sha256', DEFAULT_SEED).update(msg).digest();
  const code = toBase32(digest).slice(0, 16);
  return `LUCIDIA-AWAKEN-${date.replace(/-/g, '')}-${code}`;
}

function isLoopback(ip) {
  return ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip);
}

function logAccess(ip, path, status) {
  const line = `${new Date().toISOString()} ${ip} ${path} ${status}\n`;
  fs.appendFile('/var/log/blackroad/access.log', line, () => {});
}

function authMiddleware(req, res, next) {
  const ip = req.ip.replace('::ffff:', '');
  res.on('finish', () => logAccess(ip, req.originalUrl, res.statusCode));
  if (req.method !== 'POST') return next();
  if (isLoopback(ip)) return next();
  const key = req.get('X-BlackRoad-Key');
  if (!key) return res.status(401).json({ error: 'unauthorized' });
  if (key === originKey || key === dailyCode()) return next();
  return res.status(401).json({ error: 'unauthorized' });
}

function csrfMiddleware(req, res, next) {
  const ip = req.ip.replace('::ffff:', '');
  if (req.method !== 'POST') return next();
  if (isLoopback(ip)) return next();
  const origin = req.get('Origin') || req.get('Referer') || '';
  try {
    const u = new URL(origin);
    if (u.host !== 'blackroad.io' && u.host !== 'www.blackroad.io') {
      return res.status(403).json({ error: 'forbidden' });
    }
  } catch {
    return res.status(403).json({ error: 'forbidden' });
  }
  if (req.get('X-Requested-With') !== 'XMLHttpRequest') {
    return res.status(403).json({ error: 'forbidden' });
  }
  return next();
}

app.use('/api/llm', csrfMiddleware, authMiddleware);

// list models
app.get('/api/llm/models', async (req, res) => {
  try {
    const r = await fetch(`${OLLAMA}/api/tags`);
    const j = await r.json();
    const models = (j.models || [])
      .map(m => ({ name: m.name, size: m.size }))
      .sort((a, b) => (a.size || 0) - (b.size || 0))
      .map(m => ({ name: m.name }));
    res.json(models);
  } catch {
    res.status(502).json({ error: 'upstream_error' });
  }
});

// set default model
app.post('/api/llm/default', async (req, res) => {
  const model = (req.body && req.body.model) || '';
  if (!model) return res.status(400).json({ error: 'model_required' });
  serverDefault = model;
  try {
    fs.writeFileSync(MODEL_FILE, model, { mode: 0o600 });
  } catch {}
  // warm model
  try {
    await fetch(`${OLLAMA}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: 'ok', stream: false }),
    });
  } catch {}
  res.json({ ok: true, model });
});

// chat/stream handler
async function handleChat(req, res) {
  const body = req.body || {};
  const model = body.model || serverDefault;
  const upstreamBody = { ...body, model };
  try {
    const r = await fetch(`${OLLAMA}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(upstreamBody),
    });
    if (body.stream && r.ok && r.body) {
      res.status(200);
      const reader = r.body.getReader();
      const encoder = new TextEncoder();
      res.setHeader('Content-Type', 'text/plain');
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
      return res.end();
    }
    const txt = await r.text();
    res.status(r.ok ? 200 : r.status).type('text/plain').send(txt);
  } catch {
    res.status(502).json({ error: 'upstream_error' });
  }
}

app.post('/api/llm/chat', handleChat);
app.post('/api/llm/stream', handleChat);

app.get('/api/llm/health', (req, res) => {
  res.json({ ok: true, model: serverDefault });
});

app.listen(PORT, () => {
  console.log(`ollama bridge listening on ${PORT}`);
});

