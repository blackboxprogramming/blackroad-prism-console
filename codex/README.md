# Codex Automation

This directory houses small utilities that help automate development
workflows and record foundational Codex entries. The new **BlackRoad
pipeline** script provides a single entry point for pushing code through
GitHub and into the BlackRoad.io deployment.  It currently focuses on
scaffolding the pipeline with clear extension points for future
integrations.

## Codex Entries

| ID  | Title                  | Description                                     |
| --- | ---------------------- | ----------------------------------------------- |
| 001 | The First Principle    | Lucidia exists to protect and empower everyone. |
| 003 | The Workflow Circle    | Work runs in visible capture → adjust loops.    |
| 009 | The Transparency Accord | Every operation is logged, explainable, visible. |

## BlackRoad Pipeline

```bash
python3 codex/agents/blackroad_pipeline.py "Push latest to BlackRoad.io"
```

Available commands:

* `Push latest to BlackRoad.io` – commit/push then deploy
* `Refresh working copy and redeploy` – alias for push workflow
* `Rebase branch and update site` – rebase on `origin/main` before push
* `Sync Salesforce -> Airtable -> Droplet` – placeholder for connector syncs

Each command prints the high level actions it would perform.  Real OAuth
or webhook logic can be added by filling in the TODO sections inside the
script.

_Last updated on 2025-09-11_
