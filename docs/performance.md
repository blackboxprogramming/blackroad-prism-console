# Performance Benchmarks

This project ships a deterministic benchmark suite and service level objectives (SLOs) for each bot.

## Benchmarks

List scenarios:

```
python -m cli.console bench:list
```

Run a specific bot benchmark:

```
python -m cli.console bench:run --name "Treasury-BOT" --iter 30 --warmup 5
```

Generate reports for all bots:

```
python -m cli.console slo:report
```

Use `--perf` on any command to print a timing footer. Benchmarks write results under `artifacts/bench` and compare them against SLO targets. The `slo:gate` command fails if p95 latency regresses by more than 10%.

## Prism console load tests

We exercise the Prism console UI plus the two critical backend services (`quantum_lab` and `materials_service`) with a dedicated [`k6` scenario](../load/k6_prism_console.js). The script ships three flows:

- **`uiSmoke`** – constant 5 VUs that fetch the landing shell and dashboard bundle to ensure static assets render quickly.
- **`quantumApi`** – ramping arrival rate that logs in and runs the CHSH simulation behind the quantum token gate.
- **`materialsJobs`** – per-VU iterations that enqueue grain-coarsening jobs and poll the job status API for completions.

### How to run locally

1. Launch the service stack in separate shells (all ports bind to localhost):
   ```bash
   QUANTUM_API_TOKEN=dev-quantum uvicorn services.quantum_lab.app:app --port 8020
   FEATURE_MATERIALS=true uvicorn services.materials_service.app:app --port 8030
   (cd frontend && python -m http.server 4173)
   ```
2. Execute the k6 scenario and export the summary for later parsing:
   ```bash
   UI_BASE_URL=http://127.0.0.1:4173 \
   QUANTUM_BASE_URL=http://127.0.0.1:8020 \
   QUANTUM_TOKEN=dev-quantum \
   MATERIALS_BASE_URL=http://127.0.0.1:8030 \
   k6 run --summary-export logs/perf/k6_summary.json load/k6_prism_console.js
   ```
   The latest run artifacts live under `logs/perf/` (`k6_latest.txt` contains the stdout summary and `k6_summary.json` holds the machine-readable metrics).

### Latest results (local staging profile)

- **UI shell**: p95 = 3.94 ms, 400 requests, 0 failures.【F:logs/perf/k6_latest.txt†L243-L249】
- **Quantum Lab API**: p95 = 36.69 ms, max 189 ms during ramp-up, 380 requests, 0 failures.【F:logs/perf/k6_latest.txt†L245-L250】
- **Materials jobs API**: p95 = 9.93 ms, 30 job creations per VU, 0 failures.【F:logs/perf/k6_latest.txt†L244-L249】
- Aggregate throughput held at ~20.7 req/s with all checks passing.【F:logs/perf/k6_latest.txt†L236-L256】

Resource snapshots captured mid-test show the hottest Quantum Lab `uvicorn` worker hovering around 9% CPU and <0.3% memory; the materials worker remained idle in comparison.【F:logs/perf/snapshot1.txt†L1-L4】【F:logs/perf/snapshot2.txt†L1-L4】

### Operational thresholds and alerts

The `k6` options enforce conservative p95 thresholds (UI < 850 ms, Quantum Lab < 1.2 s, Materials < 1.4 s) so CI will fail before a regression ships.【F:load/k6_prism_console.js†L5-L81】 After each run, call the helper below to append an alert entry if any component breaches its bound:

```bash
python tools/prism_load_alerts.py  # reads logs/perf/k6_summary.json by default
```

Alerts are written as newline-delimited JSON to `data/aiops/alerts.jsonl` with the component, observed p95 latency, severity, and threshold so downstream automation (watcher bot, notebooks, etc.) can fan them out.【F:tools/prism_load_alerts.py†L6-L84】

## Quick Ollama sanity benchmark

When you only need a fast smell test for a tiny local model (1B–3B params), run the sequence below. It captures latency,
throughput, RAM/VRAM, and a basic quality score so you know whether to stay small or scale up.

1. **Pull a lightweight model** (CPU friendly examples):

   ```sh
   ollama pull llama3.2:1b
   # or
   ollama pull phi3:3.8b-mini
   ```

2. **Warm the runtime** to avoid cold-start skew:

   ```sh
   time ollama run llama3.2:1b "Say 'ready' once."
   ```

3. **Measure latency and tokens/sec** with a real prompt:

   ```sh
   PROMPT="Summarize this product pitch into 3 bullet benefits and 1 risk. Keep under 70 words."
   time ollama run llama3.2:1b "$PROMPT" > /tmp/out.txt
   # Optional richer stats (if supported):
   # ollama run llama3.2:1b --verbose true "$PROMPT"
   ```

   Record the shell `real` time and inspect `/tmp/out.txt` for quality.

4. **Snapshot memory and CPU** usage while the prompt runs:

   ```sh
   ps -o pid,cmd,%cpu,%mem,rss,vsz --sort=-%mem -C ollama
   cat /proc/meminfo | head -n 5
   ```

   Note peak RSS (convert to MB) and CPU% (or use `top`/`btop`).

5. **Spot-check output quality** (score each 0 or 1 for instruction following, coherence, and hallucination):

   ```sh
   ollama run llama3.2:1b "You have 3 apples, buy 2, eat 1. How many left? Explain briefly."
   ollama run llama3.2:1b "Write a 2-sentence, friendly release note for a bug fix in login rate limiting."
   ollama run llama3.2:1b "Output a JSON with keys title, risks[], owner='Platform', no extra text."
   ```

6. **Estimate throughput** with a longer prompt:

   ```sh
   time ollama run llama3.2:1b -f long_prompt.txt > /tmp/long.txt
   wc -w /tmp/long.txt
   ```

   Approximate tokens/sec as `(words * 0.75) / seconds`.

7. **Decide**:

   - Latency >2 s for short prompts or <20 tok/s, or failing ≥2/3 quality checks → try a heavier model (e.g., `phi3:3.8b-mini` or `llama3.1:8b-instruct-q4`).
   - Snappy and coherent → stick with the small model for cost and simplicity.

Copy/paste scorecard:

```
Model: ______________________  Quant: ____  Hardware: ____________________
Warm start latency (s): ______  Real prompt latency (s): ______  tok/s: ______
Peak RSS (MB): ______  CPU avg %: ______
Quality (3 tests): follow __/3  coherent __/3  no-hallucination __/3
Verdict: keep small | try 3–8B | need bigger
```
# Performance & Benchmarks

This project includes a small benchmark suite for validating bot Service Level Objectives (SLOs).

## SLOs

Each bot has latency and memory targets defined in `orchestrator/slo.py` and optional overrides in `config/slo.yaml`.

## Commands

```bash
python -m cli.console bench:list
python -m cli.console bench:run --name "Treasury-BOT" --iter 30 --warmup 5
python -m cli.console slo:report
```

Use `--perf` on any command to print a timing footer.

`bench:run` and `bench:all` emit JSON summaries so results can be piped into
other tooling.

## Cache Impact

`bench:run` accepts `--cache` to compare cache modes. `run_cache_experiment` writes a `cache_savings.md` file summarising speedups.

## Gating

`slo:gate` exits non-zero if benchmarks regress or exceed targets.
