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
