#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> BlackRoad install starting"
echo "ROOT: $ROOT"

requires() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: missing required binary: $1" >&2
    exit 1
  fi
}

requires node
requires npm

# Node.js version check (>= 18)
NODE_SEMVER="$(node -v | sed 's/^v//')"
NODE_MAJOR="${NODE_SEMVER%%.*}"
if [ "${NODE_MAJOR}" -lt 18 ]; then
  echo "ERROR: Node.js >= 18 required (found v${NODE_SEMVER})." >&2
  exit 1
fi

# Detect API dir
detect_api_dir() {
  local guess1="${ROOT}/srv/blackroad-api"
  local guess2="/srv/blackroad-api"
  local found=""
  if [ -d "${guess1}" ]; then
    found="${guess1}"
  elif [ -d "${guess2}" ]; then
    found="${guess2}"
  else
    # search for server_full.js up to depth 4
    local cand
    cand="$(find "${ROOT}" -maxdepth 4 -type f -name 'server_full.js' 2>/dev/null | head -n1 || true)"
    if [ -n "${cand}" ]; then
      found="$(cd "$(dirname "${cand}")" && pwd)"
    fi
  fi
  echo "${found}"
}

API_DIR="$(detect_api_dir)"
if [ -z "${API_DIR}" ]; then
  echo "ERROR: Could not locate your API directory." >&2
  echo "Hints: expected at ${ROOT}/srv/blackroad-api or /srv/blackroad-api or alongside server_full.js" >&2
  exit 1
fi

echo "==> API_DIR: ${API_DIR}"
mkdir -p "${API_DIR}"

# Ensure package.json exists (non-destructive)
if [ ! -f "${API_DIR}/package.json" ]; then
  echo "==> Initializing package.json"
  (cd "${API_DIR}" && npm init -y >/dev/null 2>&1 || true)
  # Add some default scripts if missing
  node - "${API_DIR}" <<'EOF'
const fs = require('fs');
const path = require('path');
const apiDir = process.argv[1];
const pkgPath = path.join(apiDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.scripts = Object.assign({},
  pkg.scripts || {},
  { start: pkg.scripts?.start || "node server_full.js",
    dev: pkg.scripts?.dev || "npx nodemon server_full.js" });
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log("Updated package.json scripts.");
EOF
fi

# Provide a sample package.json if desired
if [ ! -f "${API_DIR}/package.json.sample" ] && [ -f "${ROOT}/srv/blackroad-api/package.json.sample" ]; then
  cp "${ROOT}/srv/blackroad-api/package.json.sample" "${API_DIR}/package.json.sample"
fi

# Create .env if missing
if [ ! -f "${API_DIR}/.env" ]; then
  if [ -f "${ROOT}/srv/blackroad-api/.env.example" ]; then
    cp "${ROOT}/srv/blackroad-api/.env.example" "${API_DIR}/.env"
  else
    touch "${API_DIR}/.env"
  fi
  # generate secrets if missing
  genhex() {
    if command -v openssl >/dev/null 2>&1; then
      openssl rand -hex 32
    else
      # fallback
      head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n'
    fi
  }
  if ! grep -q '^JWT_SECRET=' "${API_DIR}/.env"; then
    echo "JWT_SECRET=$(genhex)" >> "${API_DIR}/.env"
  fi
  if ! grep -q '^SESSION_KEYS=' "${API_DIR}/.env"; then
    echo "SESSION_KEYS=$(genhex),$(genhex)" >> "${API_DIR}/.env"
  fi
  if ! grep -q '^DB_PATH=' "${API_DIR}/.env"; then
    echo "DB_PATH=${API_DIR}/blackroad.db" >> "${API_DIR}/.env"
  fi
  if ! grep -q '^LLM_URL=' "${API_DIR}/.env"; then
    echo "LLM_URL=http://127.0.0.1:8000" >> "${API_DIR}/.env"
  fi
  if ! grep -q '^PORT=' "${API_DIR}/.env"; then
    echo "PORT=4000" >> "${API_DIR}/.env"
  fi
  echo "Created ${API_DIR}/.env"
fi

echo "==> Scanning sources for missing npm dependencies..."
node "${ROOT}/tools/dep-scan.js" --dir "${API_DIR}" --save

# Ensure SQLite file exists
DB_PATH="$(grep -E '^DB_PATH=' "${API_DIR}/.env" | cut -d= -f2- || true)"
if [ -z "${DB_PATH}" ]; then DB_PATH="${API_DIR}/blackroad.db"; fi
mkdir -p "$(dirname "${DB_PATH}")"
if [ ! -f "${DB_PATH}" ]; then
  : > "${DB_PATH}"
  echo "Created SQLite DB at ${DB_PATH}"
fi

# Check LLM stub (port 8000)
echo "==> Checking LLM service on 127.0.0.1:8000/health"
if command -v curl >/dev/null 2>&1; then
  if ! curl -fsS "http://127.0.0.1:8000/health" >/dev/null 2>&1; then
    echo "NOTE: LLM not reachable. To start the local stub:"
    echo "  cd ${ROOT}/srv/lucidia-llm && python3 -m venv .venv && source .venv/bin/activate && \\
pip install -r requirements.txt && uvicorn app:app --host 127.0.0.1 --port 8000"
  fi
else
  echo "NOTE: 'curl' not available to verify LLM health."
fi

echo "==> Done. You can now start your API (e.g., 'cd ${API_DIR} && npm start')"
