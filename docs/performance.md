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
