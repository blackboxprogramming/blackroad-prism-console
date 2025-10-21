# Board Pack

The board pack builder collects KPIs and program status into a monthly bundle.

Create a pack:
```
python -m cli.console board:pack --month 2025-09
```
Artifacts are written to `artifacts/board/pack_YYYYMM/`.
`python -m cli.console board:pack --month 2025-09` produces a board packet under `artifacts/board/pack_202509/` containing:

- `index.md`
- `kpi_table.md`
- `risks.md`
- `program_roadmap.md`
- `finance.md`

The pack pulls KPI data from the source-of-truth and aggregates it for monthly board review.
