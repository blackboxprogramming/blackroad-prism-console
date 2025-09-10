/**
 * BlackRoad API (minimal) with LLM health + streaming chat
 * Port: 4000 (systemd: blackroad-api)
 * Upstreams:
 *   - Bridge (preferred):  http://127.0.0.1:4010
 *   - Ollama (fallback):   http://127.0.0.1:11434
 *
 * Env (optional):
 *   LLM_BRIDGE_URL=http://127.0.0.1:4010
 *   OLLAMA_URL=http://127.0.0.1:11434
 *   DEFAULT_LLM_MODEL=lucidia
 */

const express = require("express");
const app = express();

app.use(express.json({ limit: "2mb" }));

const BRIDGE_URL = process.env.LLM_BRIDGE_URL || "http://127.0.0.1:4010";
const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const DEFAULT_MODEL = process.env.DEFAULT_LLM_MODEL || "lucidia";
const PORT = process.env.PORT || 4000;

function now() { return new Date().toISOString(); }

async function tryFetch(url, opts = {}, timeoutMs = 1500) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal, cache: "no-store" });
    return res;
  } finally { clearTimeout(t); }
}

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "blackroad-api", ts: now() }));

app.get("/api/llm/health", async (_req, res) => {
  try {
    const b = await tryFetch(`${BRIDGE_URL}/health`, {}, 1200);
    if (b.ok) {
      const body = await b.json().catch(() => ({}));
      return res.json({ ok: true, upstream: "bridge", url: BRIDGE_URL, details: body, ts: now() });
    }
  } catch (_) {}
  try {
    // Ollama “tags” is a quick liveness check
    const o = await tryFetch(`${OLLAMA_URL}/api/tags`, {}, 1200);
    if (o.ok) {
      const body = await o.json().catch(() => ({}));
      return res.json({ ok: true, upstream: "ollama", url: OLLAMA_URL, details: body, ts: now() });
    }
  } catch (_) {}
  return res.status(503).json({ ok: false, error: "No LLM upstreams reachable", ts: now() });
});

// Helper: proxy a streaming response (SSE / chunked) to client as-is
async function pipeStream(upstreamResp, res) {
  // Disable buffering for Nginx and clients
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  if (!upstreamResp.body || !upstreamResp.ok) {
    const text = await upstreamResp.text().catch(() => "");
    res.status(upstreamResp.status || 502).end(text || "Upstream error");
    return;
  }

  const reader = upstreamResp.body.getReader();
  try {
    // Pass bytes through unmodified so we preserve upstream SSE/NDJSON framing
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) res.write(value);
    }
    res.end();
  } catch (err) {
    res.end();
  }
}

app.post("/api/llm/chat", async (req, res) => {
  const { messages, model, stream } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ ok: false, error: "Body must include messages: [{role, content}]" });
  }
  const chosenModel = (model && String(model)) || DEFAULT_MODEL;
  const wantStream = stream !== false; // default true

  // 1) Try bridge first
  try {
    const br = await tryFetch(`${BRIDGE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: chosenModel, messages, stream: wantStream }),
    }, 30000);

    if (wantStream) return pipeStream(br, res);

    // Non-streaming fallthrough
    const json = await br.json().catch(async () => ({ text: await br.text() }));
    return res.status(br.ok ? 200 : br.status).json(json);
  } catch (_) {}

  // 2) Fallback: direct Ollama chat
  try {
    const ol = await tryFetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: chosenModel,
        messages,
        stream: !!wantStream,
        options: { num_ctx: 4096 },
      }),
    }, 30000);

    if (wantStream) return pipeStream(ol, res);

    const json = await ol.json().catch(async () => ({ text: await ol.text() }));
    return res.status(ol.ok ? 200 : ol.status).json(json);
  } catch (e) {
    return res.status(502).json({ ok: false, error: "Both bridge and Ollama unreachable", detail: String(e) });
  }
});

// SPA fallback (optional; keep if you’ve been serving index.html here)
// const path = require("path");
// app.use(express.static("/var/www/blackroad"));
// app.get("*", (_req, res) => res.sendFile(path.join("/var/www/blackroad/index.html")));

app.use((_req, res) => res.status(404).json({ ok: false, error: "Not found" }));

app.listen(PORT, () => {
  console.log(`[blackroad-api] listening on ${PORT}`);
});

