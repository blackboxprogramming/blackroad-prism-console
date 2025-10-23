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
#!/bin/sh
set -e
DRY=0
if [ "$1" = "--dry-run" ]; then
  DRY=1
fi
run() {
  if [ "$DRY" -eq 1 ]; then
    echo "$@"
  else
    "$@"
  fi
}
echo "Environment summary"
echo "Settings: default"
echo "Data root: $(pwd)/data"
echo "Encryption: off"
run python -m cli.console bot:list
run python -m cli.console task:create --name Treasury
run python -m cli.console task:create --name RevOps
run python -m cli.console task:create --name SRE
run python -m cli.console scenario:run --name finance_margin_push
run python -m cli.console docs:build
run python -m cli.console program:roadmap
echo "Artifacts in dist/"
echo "Logs in logs/"
