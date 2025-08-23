# BlackRoad Codex Sync & Deploy

`codex/tools/blackroad_deploy.py` provides a scaffold for end-to-end
updates to **BlackRoad.io**. It bundles git operations, connector hooks,
Working Copy refreshes, and droplet deployment behind a chat-style CLI.

## Usage

```bash
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
