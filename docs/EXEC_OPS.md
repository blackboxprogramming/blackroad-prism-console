# Executive Ops
- OKRs in `okr/okr.yaml`, KPIs in `kpi/catalog.yaml`.
- `kpi_etl.ts` computes `data/kpi/kpi_latest.json` from Prometheus/finance sources.
- `forecast.ts` writes `data/finance/forecast.json` using assumptions in `finance/model/assumptions.yaml`.
- Monthly `board-pack.yml` → `board/BOARD_YYYYMM.md`; Quarterly `qbr.yml` → `board/QBR_YYYY_Q.md`.
- `apps/exec/` renders a static dashboard reading the JSON artifacts.
- Weekly `exec-digest.yml` posts a Slack summary to leadership.
