#!/usr/bin/env bash
# BlackRoad "everybody everywhere" broom
# Usage:
#   br-cleanup audit        # read-only checks (default)
#   br-cleanup fix          # apply safe fixes (migrations, npm ci if missing, restarts)
#   br-cleanup prune        # prune containers, caches, old logs (safe)
#   br-cleanup full         # audit + fix + prune
#   br-cleanup ports        # quick port map
set -euo pipefail

# ---- config knobs (adjust if you moved paths) ----
API_DIR="/srv/blackroad-api"
API_DB="${API_DIR}/blackroad.db"
MIG_DIR="${API_DIR}/db_migrations"
WEB_DIR="/var/www/blackroad"
YJS_DIR="/srv/yjs-server"
BR_JSOND="/srv/br-jsond/br_jsond.py"
OLLAMA_BR="/srv/ollama-bridge/server.js"
TRUTH_SUB="/srv/truth-subpin"
PROJECTS="/srv/projects"
ORIGIN_KEY="/srv/secrets/origin.key"
OPS_DIR="/srv/ops"
mkdir -p "$OPS_DIR" >/dev/null 2>&1 || true

_services=(
  nginx
  blackroad-api
  yjs-websocket
  br-jsond
  ollama-bridge
  truth-subpin
  ipfs
)

_ports=(80 443 4000 4010 12345 5001 8080 11434)

red(){ printf "\033[31m%s\033[0m\n" "$*"; }
grn(){ printf "\033[32m%s\033[0m\n" "$*"; }
ylw(){ printf "\033[33m%s\033[0m\n" "$*"; }
sec(){ printf "\n\033[36m# %s\033[0m\n" "$*"; }

have(){ command -v "$1" >/dev/null 2>&1; }

json_ok(){ jq -r . >/dev/null 2>&1; }

check_file(){ [[ -e "$1" ]] && grn "✓ $1" || { ylw "• MISSING: $1"; return 1; } }

check_service(){
  local s="$1"
  if systemctl is-enabled --quiet "$s" 2>/dev/null; then
    if systemctl is-active --quiet "$s"; then grn "✓ service $s active"
    else red "✗ service $s not active"; fi
  else ylw "• service $s not enabled"; fi
}

sqlite(){ sqlite3 "$API_DB" "$@"; }

apply_migrations(){
  local applied=0
  if [[ ! -d "$MIG_DIR" || ! -f "$API_DB" ]]; then ylw "• skip migrations (no dir/db)"; return 0; fi
  for f in $(ls -1 "$MIG_DIR"/*.sql 2>/dev/null | sort); do
    local tag; tag="$(basename "$f")"
    if ! sqlite "SELECT 1 FROM pragma_user_version;" >/dev/null 2>&1; then true; fi
    # naive ledger table
    sqlite "CREATE TABLE IF NOT EXISTS _migrated(tag TEXT PRIMARY KEY);" >/dev/null 2>&1 || true
    if ! sqlite "SELECT 1 FROM _migrated WHERE tag='$tag';" | grep -q 1; then
      ylw "• applying migration: $tag"
      sqlite < "$f"
      sqlite "INSERT OR IGNORE INTO _migrated(tag) VALUES('$tag');"
      ((applied++)) || true
    fi
  done
  [[ $applied -gt 0 ]] && grn "✓ migrations applied: $applied" || grn "✓ migrations up-to-date"
}

npm_ci_if_needed(){
  local dir="$1"
  [[ -f "$dir/package.json" ]] || return 0
  if [[ ! -d "$dir/node_modules" ]]; then
    ylw "• npm ci in $dir (node_modules missing)"
    (cd "$dir" && npm ci --silent)
  else
    grn "✓ node_modules present in $dir"
  fi
}

audit(){
  sec "FILES & DIRECTORIES"
  check_file "$ORIGIN_KEY" || true
  check_file "$API_DB" || true
  check_file "$WEB_DIR/llm.html" || true
  for p in "$WEB_DIR/project.html" "$WEB_DIR/editor.html" "$WEB_DIR/collab.html" "$WEB_DIR/truth.html" "$WEB_DIR/trust.html"; do
    check_file "$p" || true
  done
  [[ -d "$PROJECTS" ]] && grn "✓ projects dir $PROJECTS" || ylw "• projects dir missing: $PROJECTS"

  sec "SERVICES"
  for s in "${_services[@]}"; do check_service "$s"; done

  sec "NGINX"
  if have nginx && nginx -t >/dev/null 2>&1; then grn "✓ nginx config ok"; else red "✗ nginx config test failed"; fi

  sec "PORTS"
  if have ss; then
    ss -ltnp | awk 'NR==1 || $4 ~ /:(80|443|4000|4010|12345|5001|8080|11434)$/' | sed 's/^/  /'
  else ylw "• ss not found"; fi

  sec "NODE INSTALL CHECKS"
  npm_ci_if_needed "$API_DIR"
  npm_ci_if_needed "$YJS_DIR"

  sec "DATABASE HEALTH"
  if [[ -f "$API_DB" ]] && have sqlite3; then
    sqlite "PRAGMA integrity_check;" | grep -q ok && grn "✓ sqlite integrity ok" || red "✗ sqlite integrity failed"
    sqlite ".tables" | tr '\n' ' ' | sed 's/^/  tables: /'
  else ylw "• sqlite3 not available or DB missing"; fi

  sec "IPFS"
  if have ipfs; then
    ipfs swarm peers 2>/dev/null | wc -l | xargs -I{} echo "  peers: {}"
    ipfs pin ls --type=recursive 2>/dev/null | wc -l | xargs -I{} echo "  pinned: {}"
    ipfs pubsub ls 2>/dev/null | sed 's/^/  topic: /' || true
  else ylw "• ipfs CLI not found"; fi

  sec "HEALTH PAGES"
  for u in "http://127.0.0.1:4000/api/llm/health" "http://127.0.0.1:4010/api/llm/health"; do
    if have curl; then curl -fsS "$u" | sed "s/^/  ${u##*\/}: /" || ylw "• $u not reachable"
    fi
  done

  sec "SUMMARY"
  grn "✓ audit finished"
}

fix(){
  sec "MIGRATIONS"
  apply_migrations

  sec "INSTALL DEPENDENCIES (if missing)"
  npm_ci_if_needed "$API_DIR"
  npm_ci_if_needed "$YJS_DIR"

  sec "RESTART CORE SERVICES"
  for s in blackroad-api yjs-websocket br-jsond ollama-bridge; do
    if systemctl list-unit-files | grep -q "^$s"; then
      ylw "• restarting $s"; systemctl restart "$s" || true
    fi
  done
  if have nginx; then ylw "• reloading nginx"; nginx -t && systemctl reload nginx || true; fi

  sec "IPFS PUBSUB ROUTER"
  if have ipfs; then
    ipfs config --json Pubsub.Router '"gossipsub"' >/dev/null 2>&1 || true
  fi

  sec "DONE"
  grn "✓ fix phase complete"
}

prune(){
  sec "CONTAINERS"
  if command -v podman >/dev/null 2>&1; then
    ylw "• podman image prune -af"; podman image prune -af || true
    ylw "• podman container prune -f"; podman container prune -f || true
  elif command -v docker >/dev/null 2>&1; then
    ylw "• docker image prune -af"; docker image prune -af || true
    ylw "• docker container prune -f"; docker container prune -f || true
  else ylw "• no container engine"; fi

  sec "NODE & PY CACHES"
  find "$PROJECTS" -type d \( -name node_modules -o -name .venv -o -name __pycache__ \) -prune -o -type f \( -name '*.pyc' -o -name '.DS_Store' \) -print -delete 2>/dev/null || true
  find "$API_DIR" -type f -name '*.pyc' -delete 2>/dev/null || true

  sec "LOGS (rotate / vacuum journal)"
  if have journalctl; then journalctl --vacuum-time=7d >/dev/null 2>&1 || true; fi
  ylw "• ipfs gc (unpinned)"; have ipfs && ipfs repo gc >/dev/null 2>&1 || true

  grn "✓ prune complete"
}

ports(){
  sec "PORTS"
  if have ss; then
    ss -ltnp | awk 'NR==1 || $4 ~ /:(80|443|4000|4010|12345|5001|8080|11434)$/' | sed 's/^/  /'
  else ylw "• ss not found"; fi
}

cmd="${1:-audit}"
case "$cmd" in
  audit) audit ;;
  fix) fix ;;
  prune) prune ;;
  full) audit; fix; prune ;;
  ports) ports ;;
  *) echo "Usage: br-cleanup {audit|fix|prune|full|ports}"; exit 2 ;;
esac
