# BlackRoad Sync Pipeline

This document outlines the scaffolded end-to-end flow for updating BlackRoad.io.

## Overview

`scripts/blackroad_sync.sh` provides a unified entry point to:

1. Push local commits to GitHub (`push`)
2. Deploy the latest code to the production droplet (`deploy`)
3. Refresh an iOS Working Copy mirror and redeploy (`refresh`)
4. Run connector jobs for external services (`sync-connectors`)

Each action logs to `blackroad_sync.log` and optionally posts to Slack via
`SLACK_WEBHOOK_URL`.

## Required Environment Variables

| Variable | Purpose |
| --- | --- |
| `DROPLET_HOST` | SSH host for production droplet |
| `DROPLET_PATH` | Directory on droplet containing the repo |
| `SLACK_WEBHOOK_URL` | Incoming webhook for status updates (optional) |
| `WORKING_COPY_PATH` | Path to iOS Working Copy repository (optional) |
| `GIT_REMOTE` | Git remote name (default `origin`) |

## Examples

```bash
# Commit and push latest changes
scripts/blackroad_sync.sh push "Update message"

# Deploy to droplet
scripts/blackroad_sync.sh deploy

# Refresh working copy and deploy
scripts/blackroad_sync.sh refresh

# Run connector job scaffolds
scripts/blackroad_sync.sh sync-connectors
```

> **Note:** Connector and Working Copy steps are placeholders. Customize the
> script with project-specific commands to integrate Salesforce, Airtable,
> Slack, Linear, etc.
