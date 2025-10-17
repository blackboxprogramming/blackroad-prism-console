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
