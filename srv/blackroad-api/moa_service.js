/* Mixture-of-Agents (Qwen + Mistral) — Ensemble + Chaining
   - Starts an Express server on PORT=4020 (override via env)
   - Calls a local chat endpoint (Ollama bridge or Ollama)
   - Endpoints:
       POST /ensemble  { prompt, rubric?, models?, judgeModel? }
       POST /chain     { prompt, stages? }
   - Default models: qwen2:1.5b (or "qwen2") and mistral:latest (or "mistral")
   - Default judge:   "lucidia" then fallback to qwen2
*/

import express from "express";

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 4020;
const BASES = [
  process.env.LLM_BASE_URL,                     // e.g., http://127.0.0.1:4010/api/chat
  "http://127.0.0.1:4010/api/chat",            // your ollama-bridge (api/chat)
  "http://127.0.0.1:11434/api/chat",           // vanilla ollama (api/chat)
].filter(Boolean);

// Simple timeout wrapper
async function withTimeout(promise, ms, label="op") {
  const timeout = new Promise((_, rej) =>
    setTimeout(() => rej(new Error(`timeout:${label}:${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

// Try multiple base URLs until one works
async function postChat(payload, label="chat") {
  let lastErr;
  for (const base of BASES) {
    try {
      const res = await withTimeout(fetch(base, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }), 60000, label);
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status} @ ${base}`);
        continue;
      }
      const json = await res.json();
      // Ollama (non-stream) usually: { message: { content }, ... }
      // Bridges sometimes: { response } or { content }
      const content =
        json?.message?.content ??
        json?.response ??
        json?.content ??
        (typeof json === "string" ? json : JSON.stringify(json));
      return { text: String(content || "").trim(), raw: json, base };
    } catch (e) {
      lastErr = e;
      continue;
    }
  }
  throw lastErr ?? new Error("No chat backends reachable");
}

function sysMsg(content) { return { role: "system", content }; }
function usrMsg(content) { return { role: "user", content }; }

async function callModel({ model, prompt, system = "", temperature = 0.2 }) {
  const messages = [];
  if (system) messages.push(sysMsg(system));
  messages.push(usrMsg(prompt));
  return postChat({ model, messages, stream: false, options: { temperature } }, `chat:${model}`);
}

function pickDefaultModelName(nameCandidates) {
  // Accept full or short tags (e.g., qwen2:1.5b, qwen2, mistral:latest, mistral)
  return nameCandidates.find(Boolean);
}

// Judge: choose A or B using a small local model; return {winner, confidence, reason}
async function judge({ judgeModel, prompt, a, b, rubric = "general" }) {
  const judgeSystem = [
    "You are a strict grader.",
    "Return ONLY minified JSON: {\"winner\":\"A\"|\"B\",\"confidence\":0..1,\"reason\":\"<=120 chars\"}.",
    "Judge by rubric:",
    rubric === "coding"
      ? "- correctness, safety, runnable code, explanation when helpful"
      : rubric === "multilingual"
      ? "- fluency, faithfulness, task completion across languages"
      : "- accuracy, clarity, helpfulness, safety, concision",
  ].join("\n");

  const judgePrompt =
`PROMPT:
${prompt}

CANDIDATE A:
${a}

CANDIDATE B:
${b}

Return JSON only.`;

  try {
    const j = await callModel({
      model: judgeModel,
      prompt: judgePrompt,
      system: judgeSystem,
      temperature: 0.0,
    });
    const txt = j.text.trim();
    const parsed = JSON.parse(txt);
    if (parsed && (parsed.winner === "A" || parsed.winner === "B")) {
      return parsed;
    }
    // If judge responded verbosely, try to salvage a winner token
    const w = /"winner"\s*:\s*"([AB])"/.exec(txt)?.[1] ?? (txt.includes("A") ? "A" : "B");
    return { winner: w === "B" ? "B" : "A", confidence: 0.5, reason: "fallback-parse" };
  } catch {
    // Heuristics fallback: prefer answers with executable code for "coding" rubric
    if (rubric === "coding") {
      const hasCodeA = /```/.test(a);
      const hasCodeB = /```/.test(b);
      if (hasCodeA && !hasCodeB) return { winner: "A", confidence: 0.55, reason: "code-fallback" };
      if (!hasCodeA && hasCodeB) return { winner: "B", confidence: 0.55, reason: "code-fallback" };
    }
    // Otherwise pick longer but cap confidence
    const winner = (b.length > a.length) ? "B" : "A";
    return { winner, confidence: 0.55, reason: "length-fallback" };
  }
}

/* -------------------- /ensemble -------------------- */
app.post("/ensemble", async (req, res) => {
  const {
    prompt = "",
    rubric = "general",
    models = { a: ["qwen2:1.5b", "qwen2"], b: ["mistral:latest", "mistral"] },
    judgeModel = pickDefaultModelName(["lucidia", "qwen2:1.5b", "qwen2"]),
    systemA = "", systemB = "",
    temperature = 0.2,
  } = req.body || {};

  try {
    const modelA = pickDefaultModelName(models.a);
    const modelB = pickDefaultModelName(models.b);
    if (!prompt || !modelA || !modelB) {
      return res.status(400).json({ error: "prompt and both models required" });
    }

    const [outA, outB] = await Promise.all([
      callModel({ model: modelA, prompt, system: systemA, temperature }),
      callModel({ model: modelB, prompt, system: systemB, temperature }),
    ]);

    const verdict = await judge({
      judgeModel,
      prompt,
      a: outA.text,
      b: outB.text,
      rubric,
    });

    const winnerText = verdict.winner === "B" ? outB.text : outA.text;
    res.json({
      ok: true,
      prompt,
      rubric,
      final: winnerText,
      meta: {
        judge: { model: judgeModel, ...verdict },
        candidates: {
          A: { model: modelA, base: outA.base, excerpt: outA.text.slice(0, 600) },
          B: { model: modelB, base: outB.base, excerpt: outB.text.slice(0, 600) },
        },
      },
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

/* -------------------- /chain -------------------- */
/* stages: array of { model, role, system?, temperature? }
   Defaults: [
     { model: "qwen2", role: "draft"   },
     { model: "mistral", role: "refine" },
     { model: "qwen2", role: "guard"   }
   ]
*/
app.post("/chain", async (req, res) => {
  const {
    prompt = "",
    stages,
    temperature = 0.2,
  } = req.body || {};

  if (!prompt) return res.status(400).json({ error: "prompt required" });

  const defaultStages = [
    {
      model: pickDefaultModelName(["qwen2:1.5b", "qwen2"]),
      role: "draft",
      system:
        "You are a coding-first assistant. Produce a direct, correct draft. Prefer runnable code when appropriate.",
    },
    {
      model: pickDefaultModelName(["mistral:latest", "mistral"]),
      role: "refine",
      system:
        "You are a code hardener. Improve correctness, add missing edge-cases, tighten language. Keep output focused.",
    },
    {
      model: pickDefaultModelName(["qwen2:1.5b", "qwen2"]),
      role: "guard",
      system:
        "You are a guard. Verify correctness, remove contradictions, ensure safe, concise final answer.",
    },
  ];

  const plan = (Array.isArray(stages) && stages.length > 0) ? stages : defaultStages;

  try {
    let ctx = prompt;
    const outputs = [];

    for (const stage of plan) {
      const sys = stage.system || "";
      const p =
`TASK ROLE: ${stage.role.toUpperCase()}
INPUT:
${ctx}

REQUIREMENTS:
- Be precise. If code is needed, include a single final snippet.
- Do not repeat the full prompt unless needed.
- Keep to the role’s intent.`;

      const out = await callModel({
        model: stage.model,
        prompt: p,
        system: sys,
        temperature: stage.temperature ?? temperature,
      });
      outputs.push({ role: stage.role, model: stage.model, base: out.base, text: out.text });
      ctx = out.text; // feed forward
    }

    res.json({ ok: true, prompt, final: outputs.at(-1)?.text || "", trace: outputs });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.get("/health", (_, r) => r.json({ ok: true, service: "moa_service", port: Number(PORT) }));
app.listen(PORT, () => {
  console.log(`[moa_service] listening on :${PORT}`);
});

