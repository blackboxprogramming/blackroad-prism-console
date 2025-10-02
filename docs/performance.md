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
