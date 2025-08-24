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
# BlackRoad Codex Sync & Deploy

`codex/tools/blackroad_deploy.py` provides a scaffold for end-to-end
updates to **BlackRoad.io**. It bundles git operations, connector hooks,
Working Copy refreshes, and droplet deployment behind a chat-style CLI.

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
python3 codex/tools/blackroad_deploy.py "Push latest to BlackRoad.io"
python3 codex/tools/blackroad_deploy.py "Refresh working copy and redeploy"
```

Without an argument the script will prompt for a command.

## Environment

- `BLACKROAD_REMOTE` – SSH target for the droplet (default `root@droplet`)
- `BLACKROAD_REMOTE_PATH` – path on droplet to update (`/srv/blackroad`)
- `BLACKROAD_BRANCH` – git branch to push/pull (`main`)
- `WORKING_COPY_CMD` – command to refresh iOS Working Copy (optional)
- `SLACK_WEBHOOK_URL` – post deployment status to Slack (optional)

The script is a starting point; expand the connector and deployment steps
to match production infrastructure.
