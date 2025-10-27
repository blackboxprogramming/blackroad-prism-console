# GRCBot Manifest

## Role
GRCBot delivers governance, risk, and compliance insights spanning control frameworks,
policy updates, and regulatory commitments across BlackRoad Prism.

## Triggers
- Modifications in `grc/**`, `compliance/**`, or `bots/grc.py`
- Pull requests tagged with `bot:grc`
- Workflows executed from `.github/workflows/grcbot.yml`

## Actions
1. Load pull request metadata and construct a `Task` for `bots.grc.GRCBot`.
2. Evaluate policy, audit, and risk posture impacts using the bot's domain playbooks.
3. Publish a compliance assessment comment, @mention reviewers, and persist telemetry to `/logs/GRCBot.jsonl`.

## Outputs
- Compliance assessment with recommended mitigations and due dates.
- JSONL record appended to `/logs/GRCBot.jsonl`.
- Automatic label management for governance workstreams.
