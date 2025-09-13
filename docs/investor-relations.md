# Investor Relations

This module provides a deterministic, offline workflow for KPI computations, guidance, earnings materials, blackout enforcement, and disclosure logging.

## KPIs
Run `python -m cli.console ir:kpi:compute --period 2025Q3` to compute the KPI source-of-truth. Results are stored under `artifacts/ir/kpi_<period>.json`.

## Sign-off
Request sign-off using `python -m cli.console ir:kpi:signoff --kpi revenue --period 2025Q3 --request` and approve with `python -m cli.console ir:kpi:approve --kpi revenue --period 2025Q3 --as-user U_CFO`.

## Guidance
`python -m cli.console ir:guidance --period 2025Q4 --assumptions configs/ir/assumptions.yaml` writes ranges and narrative.

## Earnings
`python -m cli.console ir:earnings:build --period 2025Q3 --as-user U_IR` emits a script and deck under `artifacts/ir/earnings_<period>/`.

## Blackouts
Configured via `configs/ir/blackouts.yaml`. Check with `python -m cli.console ir:blackouts:status --date 2025-09-12`.

## Disclosure Ledger
Log external statements: `python -m cli.console ir:disclose --type press_note --path artifacts/ir/earnings_2025Q3/script.md --as-user U_IR`.

## FAQ Bot
Answer approved questions: `python -m cli.console ir:faq --q "What’s Q4 revenue guidance range?" --mode external`.
