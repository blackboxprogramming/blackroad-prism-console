# Investor Relations

This module provides offline tools for building earnings materials and guidance.

## KPI Source of Truth
Use `python -m cli.console ir:kpi:compute --period 2025Q3` to compute KPIs.

## Sign-off
Request and approve KPI values:
```
python -m cli.console ir:kpi:signoff --kpi revenue --period 2025Q3
python -m cli.console ir:kpi:approve --kpi revenue --period 2025Q3 --as-user U_CFO
```

## Guidance & Earnings
```
python -m cli.console ir:guidance --period 2025Q4 --assumptions configs/ir/assumptions.yaml
python -m cli.console ir:earnings:build --period 2025Q3 --as-user U_IR
```

## Blackouts & Disclosures
```
python -m cli.console ir:blackouts:status --date 2025-09-12
python -m cli.console ir:disclose --type press_note --path artifacts/ir/earnings_2025Q3/script.md --as-user U_IR
```

## FAQ Bot
```
python -m cli.console ir:faq --q "What's Q4 revenue guidance range?" --mode external --as-user U_IR
```
