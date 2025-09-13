#!/bin/bash
set -e

echo "Generating samples"
make samples

echo "Running finance pipeline"
python - <<'PY'
from pipelines.finance_margin_pipeline import run
print(run({}))
PY

echo "Running reliability pipeline"
python - <<'PY'
from pipelines.reliability_pipeline import run
print(run({}))
PY

echo "Running cookbook tasks"
python -m cli.console cookbook:run --name treasury_13w_cash
python -m cli.console cookbook:run --name sre_error_budget
python -m cli.console cookbook:run --name revops_forecast_check

echo "Artifacts produced:"
find artifacts -maxdepth 2 -type f

echo "Golden files:"
ls tests/golden
