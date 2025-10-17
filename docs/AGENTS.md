# Agents & Command Bus
- Send a command: `POST /api/agents/command { "text": "reindex search" }`.
- Slack/Discord adapters accept text and enqueue tasks.
- Queue: `data/agents/queue.jsonl`, results: `data/agents/results.jsonl`.
- Sensitive intents (deploy, schema:migrate, rotate:secrets) require approval via `change-approve.yml`.
- PR Autopilot: comment `@codex fix comments` on a PR or run the workflow manually.
