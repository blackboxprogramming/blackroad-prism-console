require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3071;

const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
app.use(cors({ origin: CORS_ORIGIN, credentials: false }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => res.json({ ok: true, provider: process.env.PROVIDER || "ollama" }));

/**
 * POST /api/codex/chat
 * Body: { persona?, messages:[{role,content}], stream?:true, model? }
 * Streams raw text tokens back to client.
 */
app.post("/api/codex/chat", async (req, res) => {
  try {
    const { messages = [], stream = true, model, persona } = req.body || {};
    const provider = (process.env.PROVIDER || "ollama").toLowerCase();

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages[] required" });
    }

    if (provider !== "ollama") {
      return res.status(400).json({ error: `Unsupported PROVIDER=${provider}` });
    }

    // Compose system header from persona (optional)
    const personaHeader = persona?.name ? `Persona: ${persona.name}. Ethics: ${(persona.ethics||[]).join(", ")}.` : "";
    const firstIsSystem = messages[0]?.role === "system";
    const sysMsg = { role: "system", content: `${personaHeader} Truth • Memory • Sovereignty. Keep answers precise; avoid flourish.` };

    const outgoing = firstIsSystem ? messages : [sysMsg, ...messages];

    // Prepare response for chunked streaming
    res.status(200);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no"); // nginx: disable buffering
    res.flushHeaders?.();

    // Call Ollama chat streaming API
    const ollamaURL = `http://${process.env.OLLAMA_HOST || "127.0.0.1:11434"}/api/chat`;
    const selectedModel = model || process.env.OLLAMA_MODEL || "phi3:instruct";

    const fetchOpts = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: selectedModel,
        stream: true,
        messages: outgoing.map(m => ({ role: m.role, content: String(m.content || "") })),
        options: {
          temperature: 0.3,
          num_ctx: 4096
        }
      })
    };

    const rr = await fetch(ollamaURL, fetchOpts);
    if (!rr.ok || !rr.body) {
      res.write(`[provider-error] HTTP ${rr.status}\n`);
      return res.end();
    }

    const reader = rr.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      // The stream is NDJSON; split on newlines
      let idx;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;
        try {
          const obj = JSON.parse(line);
          if (obj?.message?.content) res.write(obj.message.content);
          else if (obj?.response) res.write(obj.response); // /api/generate compatibility
          if (obj?.done) { buf = ""; break; }
        } catch {
          // If not JSON, just forward raw
          res.write(line);
        }
      }
    }

    return res.end();
  } catch (err) {
    res.write(`[error] ${err?.message || String(err)}\n`);
    return res.end();
  }
});

app.listen(PORT, () => {
  console.log(`codex-api listening on :${PORT}`);
});
