# CustodySync Operations Runbook

This runbook covers the baseline daily operations for BlackRoad Finance's CustodySync platform.

## Prerequisites

- Postgres database with the Prisma schema from `packages/db` migrated.
- `DATABASE_URL` exported for the CLI and API.
- Redis instance for BullMQ jobs (optional for CLI-only flows).
- Sample data located in `./samples` for local smoke tests.

## Daily Flow

1. **Initialize (one-time per environment)**
   ```bash
   blackroad-custodysync init --owner "Alexa Louise Amundson"
   ```

2. **Ingest custodian feeds**
   ```bash
   blackroad-custodysync import custodian \
     --account ACC-001 \
     --date 2025-09-30 \
     samples/fidelity_positions.csv \
     samples/fidelity_cash.csv \
     samples/fidelity_trades.csv
   ```

3. **Ingest exchange/crypto fills**
   ```bash
   blackroad-custodysync import exchange \
     --account CRYPTO-001 \
     --from 2025-09-01 \
     --to 2025-09-30 \
     samples/coinbase_fills.csv
   ```

4. **Run reconciliation**
   ```bash
   blackroad-custodysync recon --as-of 2025-09-30
   ```

5. **Review breaks**
   ```bash
   blackroad-custodysync breaks --status OPEN
   ```
   - Resolve in the CLI/API once breaks are cleared.

6. **Generate statements**
   ```bash
   blackroad-custodysync statements generate \
     --account ACC-001 \
     --period 2025Q3
   ```

7. **Audit export (for exams or quarter-end)**
   ```bash
   blackroad-custodysync audit export \
     --account ACC-001 \
     --from 2025-07-01 \
     --to 2025-09-30 \
     --out ./audit_ACC-001_2025Q3.zip
   ```

## Notes

- All writes append to the WORM ledger automatically.
- Severe unresolved breaks (severity ≥ 80 past T+2) block statement generation unless waived.
- CSV adapter mappings live in `packages/adapters/config` and can be extended per custodian.
