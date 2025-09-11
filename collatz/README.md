# Collatz Campaign (LLM-assisted)

Goal: search for Collatz counterexamples or extend verified bounds.

- Deterministic chunking; resumable via SQLite.
- Each chunk is verified by a second pass (different arithmetic schedule).
- Anomalies emit full "witness" traces for human audit.

## Quickstart

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m collatz.orchestrator --start 1 --end 100000000 --chunk 100000 --workers 4
```

## Run on multiple machines (Jetson/RPi/PC)

```bash
# On each device, point to the same repo folder (or sync via git pulls),
# then run worker(s) pulling chunks from the same SQLite DB file:
python -m collatz.worker --db ./campaign.sqlite --workers 4
```

Or just:

```bash
bash scripts/run_local.sh
```

## Outputs

- `campaign.sqlite`: jobs, results, anomalies, and checkpoints.
- `artifacts/`: CSV summaries, anomaly traces (repro inputs + partial trajectories).
- `RESULTS.md`: rolling human-readable results.

## What counts as "progress"?

1. No counterexample up to N (monotone increase of checked bound).
2. New records: largest stopping time / maximum excursion discovered with full witnesses.

_Last updated on 2025-09-11_
