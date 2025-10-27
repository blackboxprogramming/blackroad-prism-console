# Metrics & Content Refresh Runbook

## Overview
The dashboards under `/metrics`, `/deploys`, `/inbox`, and `/news` are driven by JSON assets in `sites/blackroad/public`. Refreshing them keeps the Prism console aligned with source systems before stakeholder reviews or release trains.

## Source of Truth
- **CI history (`metrics/ci.json`)**: export from GitHub Actions (`blackroad/prism`) via the `actions/runs` API filtered by workflow name. Capture the run status, duration in milliseconds, branch, and timestamps.
- **Lighthouse scores (`metrics/lh.json`)**: pull from the scheduled PageSpeed/Lighthouse job stored in the Observability bucket (`gs://blackroad-metrics/lighthouse/latest.json`). Use the averaged scores across `/`, `/portal`, and `/status`.
- **Funnels (`funnels.json`)**: query the analytics warehouse view `warehouse.analytics.funnel_events` for the last 30 days. Snapshot step counts per funnel and include conversion rates.
- **Experiments (`experiments.json`)**: treat `ops/exp/experiments.yaml` in the growth repo as canonical, or read from the Experiment Registry API (`/exp/experiments.json`).
- **Deploy history (`deploys.json`)**: rely on the deployment automation log stream (`s3://blackroad-deploys/history.ndjson`). Each record maps to a release event with channel metadata.
- **Inbox seeds (`inbox.json`)**: curate from the Customer Ops handoff doc in Notion (`Agent Inbox Seeds` database) to keep representative examples fresh.
- **News blurbs (`news.json`)**: source from the Communications editorial calendar spreadsheet (`Comms > Publish-ready blurbs`). Only mark `published: true` once comms approves copy.

## Update Cadence
- **Weekly (Monday)**: refresh CI, Lighthouse, funnels, and deploy history to keep operational dashboards current.
- **Bi-weekly (Wednesday)**: sync experiments and inbox seed messages alongside product growth planning.
- **As needed**: update news blurbs whenever Comms finalizes a post or prepares a launch.

## Procedure
1. Pull the latest records from each source system above (API export or shared doc download).
2. Normalize timestamps to ISO 8601 with `Z` suffix (UTC).
3. Trim histories to roughly the most recent 30 entries to avoid bloating payloads.
4. Overwrite the corresponding JSON file in `sites/blackroad/public` and run `npm run lint` to verify formatting if dependencies are installed.
5. Launch `npm run dev` locally and spot-check `/metrics`, `/deploys`, `/inbox`, and `/news` to confirm charts/tables render with the refreshed data.
6. Commit the changes with a clear message and run `/deploy blackroad pages` once merged to publish updates.

## Notes
- Keep the `channels` metadata in `deploys.json` in sync with any new delivery mechanisms.
- When experiments graduate, move them to an archive section or set `active: false` but retain historical context until reporting completes.
- Document deviations (e.g., missing Lighthouse run) in the PR description so reviewers know why a datapoint is stale.
