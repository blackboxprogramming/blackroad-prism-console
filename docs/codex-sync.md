# Codex Sync Pipeline

`scripts/codex_sync.py` offers a chat-style entry point for moving code from Codex all the way to the live BlackRoad.io instance.

## Features

- Auto-commit and push to GitHub with rebase handling.
- Invokes connector stubs and Slack notifications.
- Refreshes an optional iOS Working Copy checkout (`WORKING_COPY_PATH`) and redeploys the droplet via `scripts/prism_sync_build.sh`.
- Minimal FastAPI server with OAuth/webhook placeholders (`webhook-server`).

## Usage

```bash
python scripts/codex_sync.py "Push latest to BlackRoad.io"
python scripts/codex_sync.py "Refresh working copy and redeploy"
python scripts/codex_sync.py "Rebase branch and update site"
python scripts/codex_sync.py "Sync Salesforce to Airtable to Droplet"
python scripts/codex_sync.py "Start webhook server"
```

Set `SLACK_WEBHOOK_URL` to enable Slack notifications. `WORKING_COPY_PATH` can point to a Working Copy checkout on an iOS device mounted locally.

The script uses `prism_sync_build.sh` for deployment and exposes placeholder endpoints at `http://localhost:8040` when running the webhook server.
