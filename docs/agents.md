# Agents & Command Bus
- Send a command: `POST /api/agents/command { "text": "reindex search" }`.
- Slack/Discord adapters accept text and enqueue tasks.
- Queue: `data/agents/queue.jsonl`, results: `data/agents/results.jsonl`.
- Sensitive intents (deploy, schema:migrate, rotate:secrets) require approval via `change-approve.yml`.
- PR Autopilot: comment `@codex fix comments` on a PR or run the workflow manually.

## Unity World Builder

- Trigger an export with `build unity world` to queue the new automation intent.
- Behind the scenes it runs `python agents/unity_world_builder.py` which wraps the Node exporter under `workers/unity`.
- The resulting zip is placed in `downloads/unity/` with metadata captured in `BlackRoad/export.json`.
