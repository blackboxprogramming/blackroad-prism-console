#!/usr/bin/env bash
# PR Orchestrator Kit (SimulPack)
# Usage:
#   pr_orchestrate.sh 1 2 7              # build kits for PRs #1, #2, #7 (GH CLI)
#   pr_orchestrate.sh --local <refA>..<refB>  # build a kit for local diff (no GH)
# Requires: jq, gh (for GitHub mode), curl
set -euo pipefail
REPO="${REPO:-blackboxprogramming/blackroad-prism-console}"
BASE_DIR="/srv/ops/pr-kits"
PROJ_DIR="/srv/projects"; APPS_DIR="/var/www/blackroad/apps"
ORIGIN_KEY="$(sudo cat /srv/secrets/origin.key 2>/dev/null || true)"
BR_JSOND="${BR_JSOND:-http://127.0.0.1:4505/normalize}"

map_impact() {
  local path="$1"
  case "$path" in
    */srv/blackroad-api/*|*/modules/*|*/server_full.js|*/server_min.js) echo api;;
    */var/www/blackroad/*) echo ui;;
    */etc/nginx/*) echo nginx;;
    */srv/yjs-server/*|*/yjs-websocket.service*) echo yjs;;
    */srv/ollama-bridge/*|*/ollama-bridge.service*) echo bridge;;
    */srv/br-jsond/*|*/br-jsond.service*) echo jsond;;
    */etc/systemd/system/*) echo units;;
    *) echo other;;
  esac
}

emit_kit() {
  local pr="$1" title="$2" state="$3" files_json="$4"
  local dir="$BASE_DIR/PR${pr}"
  mkdir -p "$dir/contracts" "$dir/changelog" "$dir/bin"
  echo "[*] Building kit for PR#$pr → $dir"

  # classify impacts
  local impacts; impacts=$(echo "$files_json" | jq -r '.[]|.path' | while read -r f; do map_impact "$f"; done | sort -u | paste -sd',' -)
  [ -z "$impacts" ] && impacts="other"

  # save recon
  echo -e "# PR#$pr – $title\nstate: $state\nimpacts: $impacts\n\n## Files\n" > "$dir/PR_RECON.md"
  echo "$files_json" | jq -r '.[]|"- \(.path) (\(.additions) +\(.deletions))"' >> "$dir/PR_RECON.md"

  # normalize recon to JSON memory
  curl -fsS "$BR_JSOND" -H 'content-type: application/json' \
    -d "$(jq -n --arg t "$title" --arg s "$state" --arg i "$impacts" --argjson f "$files_json" '{title:$t,state:$s,impacts:$i,files:$f}')" \
    > "$dir/changelog/recon.json" || true

  # generate apply.sh
  cat > "$dir/apply.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
echo "[PR] daemon-reload"
sudo systemctl daemon-reload || true
# Restart services in safe order if their configs changed in this PR
restart_if() {
  local svc="$1" flag="$2"
  if grep -q "$flag" PR_RECON.md 2>/dev/null; then
    echo "[PR] restarting $svc"
    sudo systemctl restart "$svc" || true
  fi
}
# Always safe: yjs → api → nginx (test+reload) → bridge (if impacted)
restart_if "yjs-websocket.service" "yjs"
restart_if "blackroad-api.service"  "api"
if grep -q "nginx" PR_RECON.md; then
  echo "[PR] nginx -t"; sudo nginx -t
  echo "[PR] nginx reload"; sudo systemctl reload nginx
fi
restart_if "ollama-bridge.service" "bridge"
echo "[PR] apply done."
SH
  chmod +x "$dir/apply.sh"

  # generate verify.sh
  cat > "$dir/verify.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
KEY="$(sudo cat /srv/secrets/origin.key 2>/dev/null || true)"
fail(){ echo "[VERIFY] FAIL: $1"; exit 1; }
pass(){ echo "[VERIFY] OK: $1"; }
curl -fsS https://blackroad.io/healthz >/dev/null || fail "/healthz"
pass "/healthz"
curl -fsS http://127.0.0.1:4010/api/llm/health >/dev/null || fail "bridge"
pass "bridge"
[ -n "$KEY" ] && curl -fsS -H "X-BlackRoad-Key: $KEY" https://blackroad.io/api/projects >/dev/null || fail "/api/projects"
pass "/api/projects"
[ -n "$KEY" ] && curl -fsS -H "X-BlackRoad-Key: $KEY" https://blackroad.io/api/devices >/dev/null || fail "/api/devices"
pass "/api/devices"
# yjs backend listen check
ss -ltn | grep -q ':12345 ' && pass "yjs listen" || fail "yjs not listening"
# CSP worker-src for Monaco
curl -Is https://blackroad.io/project.html | tr -d '\r' | grep -i '^content-security-policy:' | grep -q "worker-src 'self'" && pass "CSP worker-src" || echo "[VERIFY] WARN: CSP worker-src not found"
echo "[VERIFY] success."
SH
  chmod +x "$dir/verify.sh"

  # rollback.sh
  cat > "$dir/rollback.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
if [ -x /srv/blackroad-backups/rollback_latest.sh ]; then
  sudo /srv/blackroad-backups/rollback_latest.sh
else
  echo "No snapshot rollback configured. Manually revert PR commit."
fi
SH
  chmod +x "$dir/rollback.sh"

  # kit README
  cat > "$dir/README.md" <<'MD'
# PR#$pr – $title
state: $state
impacts: $impacts

## Order
Safe restart order: yjs → api → nginx → bridge

## Scripts
- ./apply.sh   — restart impacted services safely
- ./verify.sh  — probe key endpoints
- ./rollback.sh — call snapshot rollback (if available)

## JSON Memory
Normalized recon saved to: changelog/recon.json
MD

  echo "[*] Kit ready: $dir"
}

if [ "${1:-}" = "--local" ]; then
  rng="${2:?need <refA>..<refB>}"
  files_json=$(git diff --numstat --name-only "$rng" | awk '{print $1}' | jq -R -s -c 'split("\n")[:-1] | map({path:., additions:0, deletions:0})')
  emit_kit "LOCAL" "Local diff $rng" "open" "$files_json"
  exit 0
fi

[ $# -gt 0 ] || { echo "Usage: $0 <PR#> [PR# ...]  |  $0 --local <refA>..<refB>"; exit 2; }
for pr in "$@"; do
  info=$(gh pr view "$pr" -R "$REPO" --json number,title,state,files --jq '{number,title,state,files:[.files[]|{path:.path, additions:.additions, deletions:.deletions}]}')
  title=$(echo "$info" | jq -r .title); state=$(echo "$info" | jq -r .state)
  files_json=$(echo "$info" | jq -c .files)
  mkdir -p "$BASE_DIR"
  (cd "$BASE_DIR" && mkdir -p "PR${pr}")
  emit_kit "$pr" "$title" "$state" "$files_json"
done
