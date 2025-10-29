# Mining Progress Log

This directory hosts a Git-native mining progress tracker that turns block discovery logs into a published leaderboard.

## Layout

```
logs/blocks.csv              # Append-only CSV of block discoveries
scripts/validate_log.py      # Schema and sanity checks for the log
scripts/build_leaderboards.py# Generates Markdown and JSON leaderboards
leaderboards/                # Rendered leaderboard artifacts
```

## Usage

1. Append a new block row to `logs/blocks.csv`.
2. Run the validator:
   ```bash
   python3 scripts/validate_log.py logs/blocks.csv
   ```
3. Regenerate the leaderboards:
   ```bash
   python3 scripts/build_leaderboards.py
   ```
4. Commit the updated files. A suggested Git flow:
   ```bash
   git add logs/blocks.csv
   git commit -m "log: +1 block at <height>"
   python3 scripts/build_leaderboards.py
   git add leaderboards/
   git commit -m "chore: update leaderboards"
   ```

## Pre-commit Hook

Install the repo-local pre-commit hook to prevent malformed log entries:

```bash
pre-commit install
```

The hook runs `scripts/validate_log.py` against `logs/blocks.csv` on each commit.

## Leaderboard Outputs

- `leaderboards/leaderboard.md` – human-readable summary
- `leaderboards/leaderboard.json` – machine-readable snapshot for dashboards

Run the builder regularly or automate it (for example with GitHub Actions) to keep the leaderboard fresh.
