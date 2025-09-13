# Data Warehouse Sync

The nightly `warehouse.yml` workflow runs `scripts/warehouse_sync.ts`, which posts API metrics to a data warehouse.  Configure `WAREHOUSE_URL` and `WAREHOUSE_TOKEN` as GitHub Secrets.  The script reads a JSON metrics file and sends it as a POST request.  Adjust `scripts/warehouse_sync.ts` to match your warehouse’s API.
