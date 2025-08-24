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
