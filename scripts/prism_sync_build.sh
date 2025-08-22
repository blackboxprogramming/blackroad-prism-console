#!/usr/bin/env bash
set -euo pipefail

# -------- Config --------
FRONTEND_DIR="/var/www/blackroad"
BACKEND_DIR="/srv/blackroad-api"
BACKEND_ENTRY="${BACKEND_DIR}/server_full.js"
LUCIDIA_SERVICE="lucidia-llm"
API_URL="http://127.0.0.1:4000/api/health"
SITE_URL="http://127.0.0.1/"
NGINX_TEST_URL="http://127.0.0.1/api/health"

# Repos tracked by Prism working copy (adjust if needed)
REPO_LUCIDIA="/srv/lucidia"
REPO_BLACKROAD="/srv/blackroad"

PASS=()
FAIL=()

step() { echo -e "\n=== $* ==="; }
ok()   { echo "✔ $*"; PASS+=("$*"); }
bad()  { echo "✖ $*"; FAIL+=("$*"); }

ensure_git_main () {
  local d="$1"
  if [[ -d "$d/.git" ]]; then
    ( cd "$d"
      git fetch --prune || true
      git checkout main || git checkout -b main
      if ! git pull --ff-only; then
        echo "Non-FF merge required; attempting auto-merge..."
        git pull --no-edit || true
      fi
    )
    ok "Git sync main: $d"
  else
    bad "Not a git repo: $d"
  fi
}

ensure_node_tools () {
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    ok "Node & npm present"
  else
    bad "Node/npm missing (install Node 18+ before proceeding)"
  fi
}

ensure_python_tools () {
  if command -v python3 >/dev/null 2>&1 && command -v pip3 >/dev/null 2>&1; then
    ok "Python3 & pip3 present"
  else
    bad "Python3/pip3 missing"
  fi
}

ensure_systemd_service () {
  local name="$1" file="$2"
  if systemctl list-unit-files | grep -q "^${name}\.service"; then
    ok "Systemd unit present: ${name}.service"
  else
    bad "Systemd unit missing: ${name}.service"
    if [[ -f "$file" ]]; then
      cp -f "$file" "/etc/systemd/system/${name}.service"
      systemctl daemon-reload
      ok "Installed ${name}.service"
    fi
  fi
}

curl_ok () {
  local url="$1"
  curl -fsS --max-time 5 "$url" >/dev/null 2>&1
}

port_listening () {
  local port="$1"
  ss -ltn "( sport = :$port )" | tail -n +2 | grep -q ":$port"
}

# -------- 1) Git sync both repos tracked by Prism --------
step "Git: sync lucidia and blackroad repos"
[[ -d "$REPO_LUCIDIA" ]]  && ensure_git_main "$REPO_LUCIDIA"  || bad "Missing dir $REPO_LUCIDIA"
[[ -d "$REPO_BLACKROAD" ]] && ensure_git_main "$REPO_BLACKROAD" || bad "Missing dir $REPO_BLACKROAD"

# -------- 2) Dependencies --------
step "Check toolchains"
ensure_node_tools
ensure_python_tools

# -------- 3) Backend install & systemd (blackroad-api) --------
if [[ -d "$BACKEND_DIR" ]]; then
  step "Backend: npm install"
  ( cd "$BACKEND_DIR"
    if [[ -f "package-lock.json" ]]; then npm ci || npm install; else npm install; fi
  )
  ok "Backend deps installed"

  if [[ -f "$BACKEND_ENTRY" ]]; then
    # Create a simple systemd unit if not present
    cat >/root/blackroad-api.service <<'UNIT'
[Unit]
Description=BlackRoad API (Node/Express)
After=network.target

[Service]
Type=simple
Environment=NODE_ENV=production
WorkingDirectory=/srv/blackroad-api
ExecStart=/usr/bin/node /srv/blackroad-api/server_full.js
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
UNIT

    ensure_systemd_service "blackroad-api" "/root/blackroad-api.service"
    systemctl enable blackroad-api.service >/dev/null 2>&1 || true
    systemctl restart blackroad-api.service || true

    sleep 2
    if port_listening 4000; then
      ok "blackroad-api listening on :4000"
    else
      bad "blackroad-api NOT listening on :4000"
    fi
  else
    bad "Backend entry missing: ${BACKEND_ENTRY}"
  fi
else
  bad "Missing backend directory: ${BACKEND_DIR}"
fi

# -------- 4) Lucidia LLM service check --------
step "Lucidia LLM service"
if systemctl is-active --quiet "$LUCIDIA_SERVICE"; then
  ok "${LUCIDIA_SERVICE} active"
else
  systemctl start "$LUCIDIA_SERVICE" || true
  sleep 1
  if systemctl is-active --quiet "$LUCIDIA_SERVICE"; then
    ok "${LUCIDIA_SERVICE} started"
  else
    bad "${LUCIDIA_SERVICE} not active"
  fi
fi

# Port probe (8000)
if port_listening 8000; then
  ok "Port 8000 listening (Lucidia LLM)"
else
  bad "Port 8000 not listening (Lucidia LLM)"
fi

# -------- 5) Frontend presence & Nginx proxy sanity --------
step "Frontend & Nginx checks"
if [[ -f "${FRONTEND_DIR}/index.html" ]]; then
  ok "Frontend exists: ${FRONTEND_DIR}/index.html"
else
  bad "Missing ${FRONTEND_DIR}/index.html"
fi

if curl_ok "$SITE_URL"; then
  ok "Nginx serves site root: ${SITE_URL}"
else
  bad "Nginx site root failed: ${SITE_URL}"
fi

# /api proxy health (requires backend /api/health)
if curl_ok "$NGINX_TEST_URL"; then
  ok "Nginx → /api proxy ok (${NGINX_TEST_URL})"
else
  bad "Nginx → /api proxy FAIL (${NGINX_TEST_URL})"
fi

# Direct API health on 4000 (bypassing Nginx)
if curl_ok "$API_URL"; then
  ok "Direct API health OK (${API_URL})"
else
  bad "Direct API health FAIL (${API_URL})"
fi

# -------- 6) Summary --------
step "Summary"
echo "---- PASS ----"
for p in "${PASS[@]:-}"; do echo "  ✔ $p"; done
echo "---- FAIL ----"
for f in "${FAIL[@]:-}"; do echo "  ✖ $f"; done

# Non-zero exit if any failures
if [[ "${#FAIL[@]:-0}" -gt 0 ]]; then
  exit 2
fi
echo "All checks passed."
exit 0

# =========================
# END FILE
# =========================
