# Data Layer

This repository includes a lightweight offline data lake.

- Tables are stored under `data/lake/<table>/YYYY/MM/part-####.(parquet|csv)`.
- Reads and writes go through `lake.io` which chooses Parquet when `pyarrow` is available and falls back to CSV otherwise.
- Data contracts live in `contracts/schemas` and are enforced via `contracts.validate`.
- The semantic layer exposes metrics like revenue and uptime via `semantic.query`.
- Use the CLI:
  - `python -m cli.console lake:export --table crm_opps --fmt csv --out out/opps.csv`
  - `python -m cli.console contract:validate --table crm_opps --file out/opps.csv`
