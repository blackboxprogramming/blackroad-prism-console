# GTMBot Manifest

## Role
GTMBot accelerates go-to-market execution by translating customer, pipeline, and segment insights into
repeatable launch plays for the BlackRoad Prism commercial teams.

## Triggers
- Modifications under `gtm/**`, `marketing/**`, or `bots/gtm.py`
- Pull requests tagged with `bot:gtm`
- Workflow dispatch from `.github/workflows/gtmbot.yml`

## Actions
1. Inspect the pull request payload and identify GTM-specific changes or labels.
2. Execute `bots.gtm.GTMBot` to outline launch readiness, enablement tasks, and risk signals.
3. Post a GTM readiness checklist comment, ping GTM reviewers, and append JSONL logs at `/logs/GTMBot.jsonl`.

## Outputs
- Launch readiness comment summarizing pipeline, messaging, and enablement requirements.
- JSONL log entries persisted to `/logs/GTMBot.jsonl`.
- Automatic reviewer tagging for GTM stakeholders.
