# BlackRoad.io Sync Scaffold

This repository includes a helper script, `codex/tools/blackroad_sync.py`,
that sketches an end-to-end pipeline for pushing code through Codex,
GitHub, and eventually to the live BlackRoad.io deployment.

The script currently provides a minimal chat-first control surface:

```bash
python codex/tools/blackroad_sync.py push   # commit and push local changes
python codex/tools/blackroad_sync.py sync   # placeholder for connector sync
python codex/tools/blackroad_sync.py deploy # placeholder for droplet deploy
python codex/tools/blackroad_sync.py all    # run all steps sequentially
```

Connector integration, Working Copy automation, and droplet deployment
are not yet implemented and are marked as TODOs inside the script.
# BlackRoad.io Sync Utility

`blackroad_sync.py` provides a lightweight entry point for orchestrating
GitHub pushes, working copy refreshes, branch rebases and connector
synchronization. The current implementation handles local git
operations and leaves placeholders for remote deployment and
integration with services like Salesforce or Slack.

## Usage

```bash
python scripts/blackroad_sync.py push      # Push current branch
python scripts/blackroad_sync.py refresh   # Pull latest and redeploy
python scripts/blackroad_sync.py rebase    # Rebase onto main and redeploy
python scripts/blackroad_sync.py sync      # Run connector jobs
```

Environment variables such as `BRANCH` and droplet connection details
may be used by future implementations to customize behavior.
