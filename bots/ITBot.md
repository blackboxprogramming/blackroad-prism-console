# ITBot Manifest

## Role
ITBot orchestrates technology asset provisioning, service desk triage, and lifecycle
management for devices and SaaS platforms within BlackRoad Prism.

## Triggers
- Changes to `it/**`, `infrastructure/it/**`, or `bots/it.py`
- Pull requests that receive the `bot:it` label
- Workflows launched from `.github/workflows/itbot.yml`

## Actions
1. Ingest pull request context and create a `Task` for `bots.it.ITBot`.
2. Determine provisioning requirements, incident actions, or maintenance windows.
3. Reply to the pull request with guidance, ping IT reviewers, and persist logs to `/logs/ITBot.jsonl`.

## Outputs
- IT readiness comment summarizing access, provisioning, and follow-up tickets.
- JSONL log entries within `/logs/ITBot.jsonl`.
- Automatic reviewer routing to IT maintainers.
