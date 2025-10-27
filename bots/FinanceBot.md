# FinanceBot Manifest

## Role
FinanceBot safeguards treasury operations and portfolio insights for the BlackRoad Prism console.
It synthesizes financial signals into actionable guidance for controllers, FP&A, and treasury teams.

## Triggers
- Changes to `finance/**`, `treasury/**`, or other finance domain assets
- Pull requests labelled `bot:finance`
- Automation workflows defined in `.github/workflows/financebot.yml`

## Actions
1. Parse pull request context and ingest relevant financial diffs.
2. Generate treasury, budgeting, and reporting analysis through `bots.finance.FinanceBot`.
3. Publish a pull request comment tagging domain reviewers and archive the run to `/logs/FinanceBot.jsonl`.

## Outputs
- Rich pull request comment containing variance analysis, recommendations, and follow-up items.
- JSONL log entries persisted at `/logs/FinanceBot.jsonl` for auditability.
- Automatic `bot:finance` label propagation for qualifying pull requests.
