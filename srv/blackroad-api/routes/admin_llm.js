/* global fetch */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BRIDGE_URL = process.env.LLM_BRIDGE_URL || 'http://127.0.0.1:4010';
const API_PORT = process.env.PORT || 4000;
const CONFIG_PATH = path.join(__dirname, '../../config/llm.json');

let state = { up: false, tokens_per_sec: 0, warmed_at: null };

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return { provider: 'ollama', model: 'unknown', min_tokens_per_sec: 0 };
  }
}

function bearerOk(auth) {
  const token = process.env.BR_DEPLOY_SECRET || '';
  return auth && auth.startsWith('Bearer ') && auth.slice(7).trim() === token;
}

function getStatus() {
  const cfg = readConfig();
  return { up: state.up, model: cfg.model, tokens_per_sec: state.tokens_per_sec, warmed_at: state.warmed_at };
}

module.exports = function attach(app) {
  app.get('/api/llm/health', async (_req, res) => {
    try {
      const r = await fetch(`${BRIDGE_URL}/health`);
      state.up = r.ok;
      res.status(r.ok ? 200 : 502).json({ ok: r.ok });
    } catch (e) {
      state.up = false;
      res.status(502).json({ ok: false, error: String(e) });
    }
  });

  app.post('/api/llm/generate', async (req, res) => {
    try {
      const cfg = readConfig();
      const prompt = req.body?.prompt || 'ping';
      const max = req.body?.max_tokens || 8;
      const body = {
        model: cfg.model,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        max_tokens: max,
      };
      const t0 = Date.now();
      const upstream = await fetch(`${BRIDGE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const txt = await upstream.text();
      const dt = (Date.now() - t0) / 1000;
      const tokens = txt.trim() ? txt.trim().split(/\s+/).length : 0;
      state.tokens_per_sec = dt > 0 ? tokens / dt : 0;
      state.warmed_at = new Date().toISOString();
      res.status(upstream.ok ? 200 : upstream.status).type('text/plain').send(txt);
    } catch (e) {
      res.status(502).type('text/plain').send('');
    }
  });

  app.get('/api/llm/status', (_req, res) => {
    res.json(getStatus());
  });

  app.post('/api/admin/llm/swap', async (req, res) => {
    if (!bearerOk(req.headers.authorization)) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const model = req.body?.model;
    if (!model) return res.status(400).json({ error: 'model_required' });
    try {
      execSync(`ollama pull ${model}`, { stdio: 'inherit' });
      fs.writeFileSync(
        CONFIG_PATH,
        JSON.stringify({ ...readConfig(), model }, null, 2)
      );
      await fetch(`http://127.0.0.1:${API_PORT}/api/llm/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: 'warmup', max_tokens: 8 }),
      });
      res.json({ ok: true, model });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });
};

module.exports.getStatus = getStatus;
