# Data Pipeline Contracts

This document captures the current contracts for the finance margin and reliability
pipelines so that producers and consumers share the same expectations for
schemas, validation, and orchestration behaviour.

## Finance Margin Pipeline (`pipelines/finance_margin_pipeline.py`)

### Inputs
- **Location**: `samples/generated/finance/` by default; the `sample_dir` input
  can redirect the loader to any directory structured the same way.
- **Files**:
  - `pricing.csv`: `id` (string), `price` (numeric string).
  - `cogs.csv`: `id` (string), `cogs` (numeric string).
  - `volume.csv`: `id` (string), `volume` (numeric string representing units).
- Each file must contain a header row matching the field names above.
- IDs across the three files must align; unmatched rows default missing values
  to `0.0` during the merge.

### Outputs
- Materialises `artifacts/pipelines/finance_margin/margin.csv` unless `BASE` is
  overridden (tests patch this to a temporary directory).
- Schema: `id`, `price`, `cogs`, `volume`, `margin` (all rendered as CSV strings).
  `margin` is computed as `(price - cogs) * volume`.
- Returns metadata: `{"output": <path>, "rows": <row-count>}`.

### Validation
- When `settings.STRICT_DQ` is `True`, the pipeline enforces:
  - No missing values (`dq.checks.check_missing_values`).
  - Schema validation (`dq.checks.check_schema`) against the output types above.
- Any violation raises `ValueError("DQ failure")` and halts the run.

### Test Simulation
- `pipelines/tests/test_pipelines.py::test_finance_margin_pipeline` derives
  pricing, cost, and volume samples from `fixtures/finance/tb_2025-09.csv` to
  confirm the DAG produces the expected artifact and metadata.

## Reliability Pipeline (`pipelines/reliability_pipeline.py`)

### Inputs
- **Location**: `samples/generated/ops/` by default; overridden via `sample_dir`.
- **Files**:
  - `incidents.csv`: at minimum `id`, `service`, `opened_at` columns.
  - `changes.csv`: at minimum `id`, `policy_version`, `outcome` columns.
- Both files are CSV with header rows. Additional columns are ignored by the
  transformation.

### Outputs
- Writes `artifacts/pipelines/reliability/summary.json` (or the patched base).
- JSON payload includes: `incidents`, `changes`, `burn_rate`, and `risk_flag`.
  `burn_rate` is computed as `len(incidents) / max(len(changes), 1)`.
- The function returns a dictionary with the JSON path plus the summary fields.

### Validation
- With `settings.STRICT_DQ` enabled the pipeline runs missing-value checks over
  the combined incident/change rows and validates the summary schema
  (`incidents:int`, `changes:int`, `burn_rate:float`, `risk_flag:bool`).
- Violations raise `ValueError("DQ failure")`.

### Test Simulation
- `pipelines/tests/test_pipelines.py::test_reliability_pipeline` converts
  `fixtures/servicenow/incidents.json` and the `series` entries from
  `fixtures/policy/drift_spike.series.json` into CSV inputs to execute the DAG
  end-to-end, asserting on the summary JSON.

## Orchestration Expectations

- The orchestrator records each routed task to `orchestrator/memory.jsonl`,
  applies redaction to task context and bot responses, and attaches SLO targets
  when configured.
- Integration coverage (`orchestrator/tests/test_orchestrator.py`) mocks
  upstream/downstream services to assert lineage tracking, storage writes, and
  enforcement hooks fire for successful and unknown-bot paths.

## Testing Coverage Summary

- Every `br-ingest-*` package exposes Vitest suites verifying batching, SQL
  formatting, and error handling around mocked network clients.
- Pipeline simulations and orchestrator integration tests are part of the
  repository’s pytest suite to guard end-to-end behaviour without calling real
  services.
