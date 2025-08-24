# BlackRoad Sync & Deploy Scaffold

The repository now includes a lightweight command-line helper that outlines the
end-to-end flow from local changes to the live site. It does **not** implement
production logic; instead it acts as a starting point for wiring together the
required services.

```bash
python codex/tools/blackroad_sync.py "Push latest to BlackRoad.io"
```

## Features

- commit/push helper for the current Git branch
- placeholders for Salesforce, Airtable, Slack and Linear connector jobs
- stubs for Working Copy refresh and Droplet deployment (migrations + service
  restart)
- chat-first interface that recognises high level commands such as:
  - "Push latest to BlackRoad.io"
  - "Refresh working copy and redeploy"
  - "Rebase branch and update site"
  - "Sync Salesforce -> Airtable -> Droplet"

Extend each function in `codex/tools/blackroad_sync.py` with real OAuth flows,
webhook listeners and deployment logic as the infrastructure evolves.
# BlackRoad.io Sync & Deploy

The `scripts/blackroad_sync.sh` helper provides a chat-first interface to keep
BlackRoad.io in sync across GitHub, connectors, Working Copy and the droplet.

## Usage

```bash
./scripts/blackroad_sync.sh push            # Commit and push current branch
./scripts/blackroad_sync.sh refresh         # Pull Working Copy and redeploy
./scripts/blackroad_sync.sh rebase          # Rebase current branch on origin/main
./scripts/blackroad_sync.sh sync-connectors # Salesforce → Airtable → Slack
./scripts/blackroad_sync.sh all             # End-to-end pipeline
```

## Environment variables

- `POST_PUSH_WEBHOOK` – optional URL to notify after a Git push
- `SALESFORCE_WEBHOOK` – hook to trigger Salesforce jobs
- `AIRTABLE_WEBHOOK` – hook to trigger Airtable jobs
- `SLACK_WEBHOOK` – Slack Incoming Webhook for status updates
- `WORKING_COPY_SSH` and `WORKING_COPY_PATH` – remote path for iOS Working Copy
- `DROPLET_SSH` – SSH target for the deployment server

The droplet deploy step expects the site to live at `/srv/blackroad` and will
run migrations and restart services after pulling.

Use the `all` command to push, sync connectors, refresh the working copy and
deploy in a single flow.
