# Data Warehouse Sync

BlackRoad records operational metrics nightly and forwards them to a warehouse for analytics.

## Workflow

- `.github/workflows/warehouse.yml` executes on a cron schedule (`0 4 * * *`) or manually via the **Run workflow** button.
- The job installs dependencies and executes `scripts/warehouse_sync.ts`.
- `WAREHOUSE_URL` and `WAREHOUSE_TOKEN` are provided as GitHub Secrets.

## Predictive Monitoring

`scripts/warehouse_sync.ts` reads a local metrics JSON file and posts it to the warehouse. It also maintains a rolling average for each metric to forecast anomalies. When the latest value deviates from the average by more than 20%, the script flags it in the payload and logs a warning. This lightweight forecast offers early detection without external dependencies.

Adjust `scripts/warehouse_sync.ts` to match your warehouse’s API or prediction strategy.

By coupling nightly metrics with anomaly forecasts, BlackRoad reinforces a strategy of measurable focus and disciplined trade-offs.
