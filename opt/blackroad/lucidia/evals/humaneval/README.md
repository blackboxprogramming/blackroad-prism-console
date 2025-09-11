# HumanEval for BlackRoad/Lucidia (No-Cloud)

This harness generates HumanEval completions using ONLY local models (Ollama / llama.cpp / offline Transformers), then scores with the HumanEval evaluator.

## Security
HumanEval executes **untrusted** model code during scoring. Always run in the provided Docker sandbox (`make docker-build && make docker-eval`) or inside your own jail (no net, resource caps).

## Use

```bash
make init
# pick one:
make eval-ollama
make eval-llamacpp
make eval-hf

Configure your model in configs/*.yaml. Results:
•Samples → outputs/latest.samples.jsonl
•CLI prints pass@k. For finer control, use evaluate_functional_correctness --help.

Notes
•The prompt template prompts/codex_prompt.txt is tuned for Codex Infinity: body-only output, zero chatter.
•For deterministic runs set temperature: 0.0 and increase n_samples_per_task for pass@k.

---

## What you’ve got

- **End-to-end local pipeline** for HumanEval with **Ollama**, **llama.cpp server**, or **offline Transformers** (no OpenAI calls).
- **Sandboxed Docker** run mode (no network, PID/mem caps).
- **Codex Infinity prompt** that machines respect: body-only, zero prose, passes to the harness cleanly.

If you want, I can add:
- a **vLLM** backend (OpenAI-*compatible* local server, still no OpenAI),  
- a **results dashboard** (tiny HTML that parses `evaluate_functional_correctness` output), or  
- a **Lucidia agent hook** so your Codex agent logs contradictions and pass@k deltas directly into your Ψ′ logs.

_Last updated on 2025-09-11_
