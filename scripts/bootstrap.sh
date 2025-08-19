#!/usr/bin/env bash
set -euo pipefail

mkdir -p logs data codex configs app/app adapters agents lib tests

: > logs/app.log
: > logs/contradictions.log
: > logs/prayer.log

if [ ! -f "codex/prompt_codex.txt" ]; then
  cat > codex/prompt_codex.txt <<'EOP'
(placeholder) — you should already have the real prompt file from this repo snapshot.
EOP
fi

echo "[bootstrap] directories + logs created."
