# OpsBot Manifest

## Role
OpsBot governs operational readiness across BlackRoad Prism by coordinating runbooks,
incident actions, and cross-functional dependencies for the operations guild.

## Triggers
- Commits that modify `ops/**`, `operations/**`, or `bots/ops.py`
- Pull requests with the `bot:ops` label
- Automation from `.github/workflows/opsbot.yml`

## Actions
1. Translate pull request metadata into a structured task for `bots.ops.OpsBot`.
2. Evaluate deployment readiness, incident actions, and required approvals.
3. Respond with a pull request comment and append execution metadata to `/logs/OpsBot.jsonl`.

## Outputs
- Operational readiness checklist and follow-up items in a PR comment.
- JSONL operational telemetry logged at `/logs/OpsBot.jsonl`.
- Automatic tagging for operations approvers.
