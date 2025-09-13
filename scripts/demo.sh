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
