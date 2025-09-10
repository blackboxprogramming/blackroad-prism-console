/**
 * BlackRoad API — LLM health + streaming chat + models + Operator skeleton
 * Port: 4000 (systemd: blackroad-api)
 *
 * Upstreams:
 *   - Bridge (preferred):  http://127.0.0.1:4010
 *   - Ollama (fallback):   http://127.0.0.1:11434
 *
 * Env (optional):
 *   LLM_BRIDGE_URL=http://127.0.0.1:4010
 *   OLLAMA_URL=http://127.0.0.1:11434
 *   DEFAULT_LLM_MODEL=lucidia
 *   ENABLE_OPERATOR=0   # set to 1 to enable Operator routes
 */

const express = require('express');
const app = express();

app.use(express.json({ limit: '2mb' }));

const BRIDGE_URL = process.env.LLM_BRIDGE_URL || 'http://127.0.0.1:4010';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const DEFAULT_MODEL = process.env.DEFAULT_LLM_MODEL || 'lucidia';
const ENABLE_OPERATOR = String(process.env.ENABLE_OPERATOR || '0') === '1';
const PORT = process.env.PORT || 4000;

function now() {
  return new Date().toISOString();
}

async function tryFetch(url, opts = {}, timeoutMs = 1500) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...opts,
      signal: ctrl.signal,
      cache: 'no-store',
    });
    return res;
  } finally {
    clearTimeout(t);
  }
}

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, service: 'blackroad-api', ts: now() })
);

app.get('/api/llm/health', async (_req, res) => {
  try {
    const b = await tryFetch(`${BRIDGE_URL}/health`, {}, 1200);
    if (b && b.ok) {
      const body = await b.json().catch(() => ({}));
      return res.json({
        ok: true,
        upstream: 'bridge',
        url: BRIDGE_URL,
        details: body,
        ts: now(),
      });
    }
  } catch (_) {}
  try {
    const o = await tryFetch(`${OLLAMA_URL}/api/tags`, {}, 1200);
    if (o && o.ok) {
      const body = await o.json().catch(() => ({}));
      return res.json({
        ok: true,
        upstream: 'ollama',
        url: OLLAMA_URL,
        details: body,
        ts: now(),
      });
    }
  } catch (_) {}
  return res
    .status(503)
    .json({ ok: false, error: 'No LLM upstreams reachable', ts: now() });
});

/** List available models (bridge first, then Ollama tags) */
app.get('/api/llm/models', async (_req, res) => {
  // Shape: { ok, models: [{id, provider}], upstream }
  // 1) Bridge
  try {
    const br = await tryFetch(`${BRIDGE_URL}/models`, {}, 3000);
    if (br && br.ok) {
      const j = await br.json().catch(() => ({}));
      const list = Array.isArray(j.models)
        ? j.models
        : Array.isArray(j)
          ? j
          : Array.isArray(j.data)
            ? j.data
            : [];
      const mapped = list
        .map((m) => {
          const id = m.id || m.name || m.model || String(m);
          return { id, provider: 'bridge' };
        })
        .filter((m) => m.id);
      if (mapped.length)
        return res.json({
          ok: true,
          upstream: 'bridge',
          models: mapped,
          ts: now(),
        });
    }
  } catch (_) {}

  // 2) Ollama fallback
  try {
    const o = await tryFetch(`${OLLAMA_URL}/api/tags`, {}, 3000);
    if (o && o.ok) {
      const j = await o.json().catch(() => ({}));
      const list = Array.isArray(j.models) ? j.models : [];
      const mapped = list
        .map((m) => ({ id: m.name || m.model, provider: 'ollama' }))
        .filter((m) => m.id);
      return res.json({
        ok: true,
        upstream: 'ollama',
        models: mapped,
        ts: now(),
      });
    }
  } catch (_) {}

  return res.status(502).json({
    ok: false,
    error: 'No models available from upstreams',
    ts: now(),
  });
});

// Helper: proxy a streaming response (SSE / NDJSON / chunked) to client as-is
async function pipeStream(upstreamResp, res) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering

  if (!upstreamResp.body || !upstreamResp.ok) {
    const text = await upstreamResp.text().catch(() => '');
    res.status(upstreamResp.status || 502).end(text || 'Upstream error');
    return;
  }

  const reader = upstreamResp.body.getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) res.write(value);
    }
    res.end();
  } catch (_) {
    res.end();
  }
}

app.post('/api/llm/chat', async (req, res) => {
  const { messages, model, stream } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      ok: false,
      error: 'Body must include messages: [{role, content}]',
    });
  }
  const chosenModel = (model && String(model)) || DEFAULT_MODEL;
  const wantStream = stream !== false; // default true

  // 1) Try bridge first
  try {
    const br = await tryFetch(
      `${BRIDGE_URL}/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: chosenModel,
          messages,
          stream: wantStream,
        }),
      },
      30000
    );

    if (wantStream) return pipeStream(br, res);

    const json = await br.json().catch(async () => ({ text: await br.text() }));
    return res.status(br.ok ? 200 : br.status).json(json);
  } catch (_) {}

  // 2) Fallback: Ollama chat
  try {
    const ol = await tryFetch(
      `${OLLAMA_URL}/api/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: chosenModel,
          messages,
          stream: !!wantStream,
          options: { num_ctx: 4096 },
        }),
      },
      30000
    );

    if (wantStream) return pipeStream(ol, res);

    const json = await ol.json().catch(async () => ({ text: await ol.text() }));
    return res.status(ol.ok ? 200 : ol.status).json(json);
  } catch (e) {
    return res.status(502).json({
      ok: false,
      error: 'Both bridge and Ollama unreachable',
      detail: String(e),
    });
  }
});

/** Operator status + skeleton; gated by ENABLE_OPERATOR */
app.get('/api/operator/status', (_req, res) => {
  res.json({ ok: true, enabled: ENABLE_OPERATOR, ts: now() });
});

app.post('/api/operator/plan', async (req, res) => {
  if (!ENABLE_OPERATOR)
    return res.status(403).json({ ok: false, error: 'Operator disabled' });
  const { objective, context } = req.body || {};
  if (!objective)
    return res
      .status(400)
      .json({ ok: false, error: "Missing 'objective' string" });

  const sys = [
    {
      role: 'system',
      content:
        'You are Operator, a cautious on-device agent. Produce a JSON-only plan with fields: steps[], tools[], risks[], checkpoints[]. ' +
        'Never execute. No external links. Keep steps atomic and safe. Output STRICT JSON.',
    },
  ];
  const user = [
    {
      role: 'user',
      content: JSON.stringify({ objective, context: context || '' }),
    },
  ];

  // Prefer bridge, fallback to Ollama
  try {
    const br = await tryFetch(
      `${BRIDGE_URL}/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages: [...sys, ...user],
          stream: false,
        }),
      },
      30000
    );
    if (br && br.ok) {
      const j = await br.json().catch(async () => ({ text: await br.text() }));
      // Normalise: if upstream returns {message:{content}} or {text}
      const planText =
        j?.message?.content ||
        j?.choices?.[0]?.message?.content ||
        j?.text ||
        j?.response ||
        JSON.stringify(j);
      return res.json({
        ok: true,
        plan: safeJson(planText),
        ts: now(),
        upstream: 'bridge',
      });
    }
  } catch (_) {}

  try {
    const ol = await tryFetch(
      `${OLLAMA_URL}/api/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages: [...sys, ...user],
          stream: false,
          options: { num_ctx: 4096 },
        }),
      },
      30000
    );
    const j = await ol.json().catch(async () => ({ text: await ol.text() }));
    const planText =
      j?.message?.content ||
      j?.choices?.[0]?.message?.content ||
      j?.text ||
      j?.response ||
      JSON.stringify(j);
    return res.status(ol.ok ? 200 : ol.status).json({
      ok: true,
      plan: safeJson(planText),
      ts: now(),
      upstream: 'ollama',
    });
  } catch (e) {
    return res.status(502).json({
      ok: false,
      error: 'Operator upstream failed',
      detail: String(e),
    });
  }
});

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: String(text) };
  }
}

// SPA static serving is optional; keep enabled if you use it here.
// const path = require("path");
// app.use(express.static("/var/www/blackroad"));
// app.get("*", (_req, res) => res.sendFile(path.join("/var/www/blackroad/index.html")));

app.use((_req, res) => res.status(404).json({ ok: false, error: 'Not found' }));

app.listen(PORT, () => {
  console.log(`[blackroad-api] listening on ${PORT}`);
});
