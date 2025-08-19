#!/usr/bin/env bash
set -euo pipefail

# locate conda (adjust if using micromamba)
if command -v conda >/dev/null 2>&1; then
  CONDA_BASE="$(conda info --base)"
  # shellcheck disable=SC1091
  source "$CONDA_BASE/etc/profile.d/conda.sh"
  conda activate blackroad-chem
elif command -v micromamba >/dev/null 2>&1; then
  eval "$(micromamba shell hook -s bash)"
  micromamba activate blackroad-chem
else
  echo "No conda/micromamba found" >&2
  exit 1
fi

exec uvicorn app:app --host 0.0.0.0 --port 7014 --workers 1
