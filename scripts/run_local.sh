#!/usr/bin/env bash
set -euo pipefail
python3 -m venv .venv || true
source .venv/bin/activate
pip install -r requirements.txt
python -m collatz.orchestrator --start 1 --end 10000000 --chunk 200000
python -m collatz.worker --workers 4
python -m collatz.verifier
