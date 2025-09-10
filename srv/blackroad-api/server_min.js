/**
 * BlackRoad API — LLM health + streaming chat + cached models + embeddings + Operator/RPA (no-exec)
 * Port: 4000 (systemd: blackroad-api)
 *
 * Upstreams:
 *   Bridge (preferred):  http://127.0.0.1:4010
 *   Ollama (fallback):   http://127.0.0.1:11434
 *
 * Env (optional):
 *   LLM_BRIDGE_URL=http://127.0.0.1:4010
 *   OLLAMA_URL=http://127.0.0.1:11434
 *   DEFAULT_LLM_MODEL=lucidia
 *   MODELS_TTL_MS=300000              # 5m cache for models
 *   ENABLE_OPERATOR=0                 # 1 to enable Operator routes
 *   ENABLE_RPA=0                      # 1 to enable RPA sandbox routes
 *   RPA_ALLOW_HOSTS=blackroad.io,localhost,127.0.0.1
 */

const express = require("express");
const app = express();

app.use(express.json({ limit: "2mb" }));

const BRIDGE_URL = process.env.LLM_BRIDGE_URL || "http://127.0.0.1:4010";
const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const DEFAULT_MODEL = process.env.DEFAULT_LLM_MODEL || "lucidia";
const MODELS_TTL_MS = parseInt(process.env.MODELS_TTL_MS || "300000", 10);
const ENABLE_OPERATOR = String(process.env.ENABLE_OPERATOR || "0") === "1";
const ENABLE_RPA = String(process.env.ENABLE_RPA || "0") === "1";
const RPA_ALLOW_HOSTS = String(process.env.RPA_ALLOW_HOSTS || "").split(",").map(s => s.trim()).filter(Boolean);
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
    if (b && b.ok) {
      const body = await b.json().catch(() => ({}));
      return res.json({ ok: true, upstream: "bridge", url: BRIDGE_URL, details: body, ts: now() });
    }
  } catch (_) {}
  try {
    const o = await tryFetch(`${OLLAMA_URL}/api/tags`, {}, 1200);
    if (o && o.ok) {
      const body = await o.json().catch(() => ({}));
      return res.json({ ok: true, upstream: "ollama", url: OLLAMA_URL, details: body, ts: now() });
    }
  } catch (_) {}
  return res.status(503).json({ ok: false, error: "No LLM upstreams reachable", ts: now() });
});

/* ---------- Models (direct, cached, refresh) ---------- */

let modelsCache = { ts: 0, data: null, upstream: null };

async function fetchModelsDirect() {
  // Try bridge
  try {
    const br = await tryFetch(`${BRIDGE_URL}/models`, {}, 3000);
    if (br && br.ok) {
      const j = await br.json().catch(() => ({}));
      const list = Array.isArray(j.models) ? j.models :
                   Array.isArray(j) ? j :
                   Array.isArray(j.data) ? j.data : [];
      const mapped = list.map(m => ({ id: m.id || m.name || m.model || String(m), provider: "bridge" }))
                         .filter(m => m.id);
      if (mapped.length) return { ok: true, upstream: "bridge", models: mapped };
    }
  } catch (_) {}
  // Fallback: ollama tags
  try {
    const o = await tryFetch(`${OLLAMA_URL}/api/tags`, {}, 3000);
    if (o && o.ok) {
      const j = await o.json().catch(() => ({}));
      const list = Array.isArray(j.models) ? j.models : [];
      const mapped = list.map(m => ({ id: m.name || m.model, provider: "ollama" })).filter(m => m.id);
      return { ok: true, upstream: "ollama", models: mapped };
    }
  } catch (_) {}
  return { ok: false, error: "No models available from upstreams" };
}

async function getModelsCached(force = false) {
  const age = Date.now() - (modelsCache.ts || 0);
  if (!force && modelsCache.data && age < MODELS_TTL_MS) {
    return { ok: true, cached: true, upstream: modelsCache.upstream, models: modelsCache.data };
  }
  const fresh = await fetchModelsDirect();
  if (fresh.ok) {
    modelsCache = { ts: Date.now(), data: fresh.models, upstream: fresh.upstream };
  }
  return { ...fresh, cached: false, ts: now() };
}

// Legacy/direct endpoint (no cache)
app.get("/api/llm/models", async (_req, res) => {
  const out = await fetchModelsDirect();
  if (out.ok) return res.json({ ...out, ts: now() });
  return res.status(502).json({ ...out, ts: now() });
});

// Cached endpoint with TTL
app.get("/api/llm/models:cache", async (req, res) => {
  const force = String(req.query.refresh || "0") === "1";
  const out = await getModelsCached(force);
  if (out.ok) return res.json({ ...out, ts: now(), ttl_ms: MODELS_TTL_MS });
  return res.status(502).json({ ...out, ts: now(), ttl_ms: MODELS_TTL_MS });
});

// Explicit refresh path
app.post("/api/llm/models:refresh", async (_req, res) => {
  const out = await getModelsCached(true);
  if (out.ok) return res.json({ ...out, ts: now(), ttl_ms: MODELS_TTL_MS });
  return res.status(502).json({ ...out, ts: now(), ttl_ms: MODELS_TTL_MS });
});

/* ---------- Chat (streaming passthrough) ---------- */

async function pipeStream(upstreamResp, res) {
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

app.post("/api/llm/chat", async (req, res) => {
  const { messages, model, stream } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ ok: false, error: "Body must include messages: [{role, content}]" });
  }
  const chosenModel = (model && String(model)) || DEFAULT_MODEL;
  const wantStream = stream !== false;

  // Bridge first
  try {
    const br = await tryFetch(`${BRIDGE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: chosenModel, messages, stream: wantStream }),
    }, 30000);
    if (wantStream) return pipeStream(br, res);
    const json = await br.json().catch(async () => ({ text: await br.text() }));
    return res.status(br.ok ? 200 : br.status).json(json);
  } catch (_) {}

  // Ollama fallback
  try {
    const ol = await tryFetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: chosenModel, messages, stream: !!wantStream, options: { num_ctx: 4096 } }),
    }, 30000);
    if (wantStream) return pipeStream(ol, res);
    const json = await ol.json().catch(async () => ({ text: await ol.text() }));
    return res.status(ol.ok ? 200 : ol.status).json(json);
  } catch (e) {
    return res.status(502).json({ ok: false, error: "Both bridge and Ollama unreachable", detail: String(e) });
  }
});

/* ---------- Embeddings (stub: bridge, then Ollama if supported) ---------- */

app.post("/api/llm/embeddings", async (req, res) => {
  const { input, model } = req.body || {};
  const chosenModel = (model && String(model)) || DEFAULT_MODEL;
  if (typeof input === "undefined" || input === null) {
    return res.status(400).json({ ok: false, error: "Body must include 'input' (string or array)" });
  }

  // 1) Bridge attempt
  try {
    const br = await tryFetch(`${BRIDGE_URL}/embeddings`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: chosenModel, input })
    }, 30000);
    if (br && br.ok) {
      const j = await br.json().catch(async () => ({ text: await br.text() }));
      return res.json({ ok: true, upstream: "bridge", ...j, ts: now() });
    }
  } catch (_) {}

  // 2) Ollama attempt (if endpoint exists in your version)
  try {
    const ol = await tryFetch(`${OLLAMA_URL}/api/embeddings`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: chosenModel, input })
    }, 30000);
    if (ol && ol.ok) {
      const j = await ol.json().catch(async () => ({ text: await ol.text() }));
      return res.json({ ok: true, upstream: "ollama", ...j, ts: now() });
    }
    // If Ollama returns 404, your build may not support embeddings
    const text = await ol.text().catch(() => "");
    return res.status(ol.status || 501).json({ ok: false, error: "Embeddings not supported by upstream", detail: text, ts: now() });
  } catch (e) {
    return res.status(502).json({ ok: false, error: "Embeddings upstream failed", detail: String(e), ts: now() });
  }
});

/* ---------- Operator + RPA Sandbox (flag-gated) ---------- */

app.get("/api/operator/status", (_req, res) => {
  res.json({
    ok: true,
    enabled: ENABLE_OPERATOR,
    rpa_enabled: ENABLE_RPA,
    rpa_allow_hosts: RPA_ALLOW_HOSTS,
    ts: now()
  });
});

app.post("/api/operator/plan", async (req, res) => {
  if (!ENABLE_OPERATOR) return res.status(403).json({ ok: false, error: "Operator disabled" });
  const { objective, context } = req.body || {};
  if (!objective) return res.status(400).json({ ok: false, error: "Missing 'objective' string" });

  const sys = [
    { role: "system", content:
      "You are Operator, a cautious on-device agent. Produce a JSON-only plan with fields: steps[], tools[], risks[], checkpoints[]. " +
      "Never execute. No external links. Keep steps atomic and safe. Output STRICT JSON." }
  ];
  const user = [{ role: "user", content: JSON.stringify({ objective, context: context || "" }) }];

  try {
    const br = await tryFetch(`${BRIDGE_URL}/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: DEFAULT_MODEL, messages: [...sys, ...user], stream: false })
    }, 30000);
    if (br && br.ok) {
      const j = await br.json().catch(async () => ({ text: await br.text() }));
      const planText = j?.message?.content || j?.choices?.[0]?.message?.content || j?.text || j?.response || JSON.stringify(j);
      return res.json({ ok: true, plan: safeJson(planText), ts: now(), upstream: "bridge" });
    }
  } catch (_) {}

  try {
    const ol = await tryFetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: DEFAULT_MODEL, messages: [...sys, ...user], stream: false, options: { num_ctx: 4096 } })
    }, 30000);
    const j = await ol.json().catch(async () => ({ text: await ol.text() }));
    const planText = j?.message?.content || j?.choices?.[0]?.message?.content || j?.text || j?.response || JSON.stringify(j);
    return res.status(ol.ok ? 200 : ol.status).json({ ok: true, plan: safeJson(planText), ts: now(), upstream: "ollama" });
  } catch (e) {
    return res.status(502).json({ ok: false, error: "Operator upstream failed", detail: String(e) });
  }
});

function hostAllowed(urlStr) {
  try {
    const u = new URL(urlStr);
    return RPA_ALLOW_HOSTS.length === 0 || RPA_ALLOW_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

app.get("/api/operator/rpa/status", (_req, res) => {
  res.json({ ok: true, enabled: ENABLE_OPERATOR && ENABLE_RPA, allow_hosts: RPA_ALLOW_HOSTS, ts: now() });
});

app.post("/api/operator/rpa/dry-run", (req, res) => {
  if (!(ENABLE_OPERATOR && ENABLE_RPA)) return res.status(403).json({ ok: false, error: "RPA disabled" });
  const { url, actions } = req.body || {};
  if (!url || !Array.isArray(actions)) return res.status(400).json({ ok: false, error: "Body must include { url, actions: [] }" });
  if (!hostAllowed(url)) return res.status(403).json({ ok: false, error: "URL host not allowed", url, allow_hosts: RPA_ALLOW_HOSTS });

  const sanitized = actions.map((a, i) => {
    const type = String(a.type || "").toLowerCase();
    const safe = {
      idx: i,
      type,
      selector: a.selector ? String(a.selector).slice(0, 200) : null,
      text: type === "type" ? String(a.text || "").slice(0, 500) : undefined,
      seconds: typeof a.seconds === "number" ? Math.min(Math.max(a.seconds, 0), 30) : undefined
    };
    // Only allow a small safe subset in sandbox
    const allowed = ["goto", "wait", "type", "click"];
    safe.allowed = allowed.includes(type);
    return safe;
  });

  return res.json({
    ok: true,
    mode: "dry-run",
    note: "No execution performed. This endpoint validates and echoes a safe plan.",
    url,
    actions: sanitized,
    ts: now()
  });
});

/* ---------- Fallbacks ---------- */

function safeJson(text) {
  try { return JSON.parse(text); }
  catch { return { raw: String(text) }; }
}

// Optional SPA serving:
// const path = require("path");
// app.use(express.static("/var/www/blackroad"));
// app.get("*", (_req, res) => res.sendFile(path.join("/var/www/blackroad/index.html")));

app.use((_req, res) => res.status(404).json({ ok: false, error: "Not found" }));

app.listen(PORT, () => {
  console.log(`[blackroad-api] listening on ${PORT}`);
});

