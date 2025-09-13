# Board Pack

`python -m cli.console board:pack --month 2025-09` produces a board packet under `artifacts/board/pack_202509/` containing:

- `index.md`
- `kpi_table.md`
- `risks.md`
- `program_roadmap.md`
- `finance.md`

The pack pulls KPI data from the source-of-truth and aggregates it for monthly board review.
