import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json({ limit: '2mb' }));

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434/v1';

// Health: checks both bridge and Ollama
app.get('/health', async (req, res) => {
  try {
    const r = await fetch(`${OLLAMA_URL}/models`);
    const ok = r.ok;
    res.status(ok ? 200 : 502).json({ ok, upstream: ok ? 'up' : 'down' });
  } catch (e) {
    res.status(502).json({ ok: false, error: String(e) });
  }
});

// Default chat (base assistant)
app.post('/v1/chat/completions', async (req, res) => {
  const body = req.body || {};
  // default to lucidia alias; allow override
  body.model = body.model || 'lucidia:qwen15b';
  body.stream = body.stream !== false;

  // pass through to Ollama’s OpenAI‑compatible API
  const upstream = await fetch(`${OLLAMA_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  // Stream transparently (SSE/NDJSON)
  res.status(upstream.status);
  upstream.headers.forEach((v, k) => res.setHeader(k, v));
  upstream.body.pipe(res);
});

// Coding route (forces coder model)
app.post('/v1/chat/completions/coder', async (req, res) => {
  const body = { ...req.body, model: 'lucidia-coder:7b', stream: true };
  const upstream = await fetch(`${OLLAMA_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  res.status(upstream.status);
  upstream.headers.forEach((v, k) => res.setHeader(k, v));
  upstream.body.pipe(res);
});

const port = process.env.PORT || 4010;
app.listen(port, () => console.log(`ollama-bridge listening on :${port}`));
