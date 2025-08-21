#!/usr/bin/env bash
set -euo pipefail

# Refresh AIHawk repo on container start (keeps you current without rebuild)
if [ -n "${AIHAWK_REPO_URL:-}" ]; then
  mkdir -p /opt/aih
  if [ ! -d "${AIHAWK_DIR}" ]; then
    git clone --depth=1 --branch "${AIHAWK_BRANCH:-main}" "${AIHAWK_REPO_URL}" "${AIHAWK_DIR}" || true
  else
    git -C "${AIHAWK_DIR}" fetch --depth=1 origin "${AIHAWK_BRANCH:-main}" || true
    git -C "${AIHAWK_DIR}" reset --hard "origin/${AIHAWK_BRANCH:-main}" || true
  fi
  if [ -f "${AIHAWK_DIR}/requirements.txt" ]; then
    pip install -r "${AIHAWK_DIR}/requirements.txt" || true
  fi
fi

# Run API
exec python -m uvicorn app.server:app --host 0.0.0.0 --port "${PORT:-9301}"
