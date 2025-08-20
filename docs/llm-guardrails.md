# LLM Guardrails & Quality Checks

- **Feature flag:** `.github/feature-flags.yml` → `ai_tools: true|false`
- **Evaluator:** `.github/tools/llm/prompt-eval.js` (uses `OLLAMA_URL`, `OLLAMA_MODEL`)
- **Heuristics:** `.github/tools/llm/hallucination-check.js` (keywords, toxicity list)
- **Artifacts:** `artifacts/llm-eval/*.json`, `latency.json`, `SUMMARY.md`
- **Disable quickly:** `/toggle ai off` (ChatOps) or flip flag in PR
- **Advisory:** All checks are **skip-safe**. They never fail CI by default.
