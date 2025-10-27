# CommsBot Manifest

## Role
CommsBot steers internal and external communication cadences, ensuring launch messaging,
incident responses, and employee updates remain timely and aligned with brand standards.

## Triggers
- Edits under `comms/**`, `communications/**`, or `bots/comms.py`
- Pull requests labelled `bot:comms`
- Workflows started from `.github/workflows/commsbot.yml`

## Actions
1. Parse pull request event content and build a `Task` for `bots.comms.CommsBot`.
2. Generate messaging guidance, approval checklists, and cross-functional callouts.
3. Leave a communications readiness comment, notify comms reviewers, and log to `/logs/CommsBot.jsonl`.

## Outputs
- Messaging checklist comment with channels, audiences, and approvals.
- JSONL log entries stored at `/logs/CommsBot.jsonl`.
- Automatic label routing for communications work.
