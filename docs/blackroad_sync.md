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
