# Healthcheck Utilities

The `healthchecks.synthetic` module produces deterministic stubbed results that are saved to `artifacts/healthchecks/<service>/latest.json`. Use it to validate the observability pipeline locally without reaching production services.

## Running a Synthetic Check
```bash
python -m healthchecks.synthetic prism
```
The command writes a JSON artifact, validates it against `schemas/healthcheck.schema.json`, and returns the individual check entries.

## Updating Dashboards
The Grafana dashboards read these artifacts to populate synthetic availability tiles. If the timestamps are stale, re-run the synthetic check and commit the refreshed artifact before deploying dashboard changes.
