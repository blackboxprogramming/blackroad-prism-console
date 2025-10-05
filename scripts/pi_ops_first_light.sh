#!/usr/bin/env bash
set -euo pipefail

log() { printf '\n[%s] %s\n' "pi-ops-first-light" "$*"; }
warn() { printf '[pi-ops-first-light] WARN: %s\n' "$*" >&2; }

: "${BACKPLANE_URL:=http://127.0.0.1:4000}"
: "${GRAFANA_URL:=http://127.0.0.1:3000/d/pi-ops-ultra/ops?orgId=1&kiosk&refresh=5s}"
: "${DISPLAY_MINI_ID:=display-mini}"
: "${DISPLAY_MAIN_ID:=display-main}"
: "${LED_DEVICE_ID:=pi-01}"
: "${JETSON_DEVICE_ID:=jetson-01}"
: "${SIM_PANEL_URL:=}"
: "${BR_KEY:=}"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required" >&2
  exit 1
fi

b64enc() {
  printf '%s' "$1" | base64 | tr -d '\n'
}

curl_headers=(-H "Content-Type: application/json")
if [ -n "$BR_KEY" ]; then
  curl_headers+=(-H "X-BlackRoad-Key: $BR_KEY")
fi

curl_opts=(--silent --show-error --fail --retry 2 --retry-delay 1 --retry-connrefused --max-time 15)

post_device_command() {
  local device="$1" payload="$2"
  curl "${curl_opts[@]}" "${curl_headers[@]}" -XPOST "$BACKPLANE_URL/api/devices/${device}/command" -d "$payload" >/dev/null
}

post_device_telemetry() {
  local device="$1" payload="$2"
  curl "${curl_opts[@]}" "${curl_headers[@]}" -XPOST "$BACKPLANE_URL/api/devices/${device}/telemetry" -d "$payload" >/dev/null
}

send_sim_panel() {
  if [ -z "$SIM_PANEL_URL" ]; then
    return 1
  fi
  local ts
  ts=$(date -u +"%FT%TZ")
  local payload
  payload=$(cat <<JSON
{"event":"pi-ops.first-light","ts":"${ts}","summary":"Displays verified and heartbeats sent","grafanaUrl":"${GRAFANA_URL}"}
JSON
)
  local url="$SIM_PANEL_URL"
  local headers=(-H "Content-Type: application/json")
  if [ -n "$BR_KEY" ]; then
    headers+=(-H "X-BlackRoad-Key: $BR_KEY")
  fi
  curl "${curl_opts[@]}" "${headers[@]}" -XPOST "$url" -d "$payload" >/dev/null
}

# Prepare SVG patterns
read -r -d '' MINI_PATTERN <<'SVG' || true
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#50fa7b"/>
      <stop offset="50%" stop-color="#ffb86c"/>
      <stop offset="100%" stop-color="#ff5555"/>
    </linearGradient>
  </defs>
  <rect width="320" height="240" fill="url(#grad)"/>
  <g font-family="Inter,Segoe UI,Arial" font-weight="600" text-anchor="middle">
    <text x="160" y="110" font-size="42" fill="#282a36">PI-OPS</text>
    <text x="160" y="160" font-size="24" fill="#f8f8f2">Mini panel test</text>
  </g>
</svg>
SVG

read -r -d '' MAIN_PATTERN <<'SVG' || true
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 600">
  <defs>
    <pattern id="checker" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="80" height="80" fill="#1e1f29"/>
      <rect x="0" y="0" width="40" height="40" fill="#bd93f9" opacity="0.7"/>
      <rect x="40" y="40" width="40" height="40" fill="#8be9fd" opacity="0.7"/>
    </pattern>
  </defs>
  <rect width="1600" height="600" fill="url(#checker)"/>
  <g font-family="Inter,Segoe UI,Arial" font-weight="600" text-anchor="middle">
    <text x="800" y="260" font-size="96" fill="#f8f8f2">Pi-Ops Kiosk</text>
    <text x="800" y="360" font-size="54" fill="#ff79c6">Ultrawide diagnostics</text>
  </g>
</svg>
SVG

MINI_DATA_URI="data:image/svg+xml;base64,$(b64enc "$MINI_PATTERN")"
MAIN_DATA_URI="data:image/svg+xml;base64,$(b64enc "$MAIN_PATTERN")"

log "Waking displays"
post_device_command "$DISPLAY_MINI_ID" '{"type":"display.wake"}'
post_device_command "$DISPLAY_MAIN_ID" '{"type":"display.wake"}'

log "Pushing test patterns"
post_device_command "$DISPLAY_MINI_ID" "{\"type\":\"display.show\",\"target\":\"mini\",\"mode\":\"image\",\"src\":\"$MINI_DATA_URI\"}"
post_device_command "$DISPLAY_MAIN_ID" "{\"type\":\"display.show\",\"target\":\"main\",\"mode\":\"image\",\"src\":\"$MAIN_DATA_URI\"}"

log "Posting telemetry heartbeats"
ts=$(date -u +"%FT%TZ")
pi_payload=$(cat <<JSON
{"id":"${LED_DEVICE_ID}","role":"pi_led","ts":"${ts}","cpu":37.5,"state":"ok","heartbeat":"first-light"}
JSON
)
jetson_payload=$(cat <<JSON
{"id":"${JETSON_DEVICE_ID}","role":"jetson","ts":"${ts}","cpu":41.2,"gpu":35.4,"llm":{"state":"idle","tps":0},"heartbeat":"first-light"}
JSON
)
post_device_telemetry "$LED_DEVICE_ID" "$pi_payload"
post_device_telemetry "$JETSON_DEVICE_ID" "$jetson_payload"

log "Announcing status"
if ! send_sim_panel; then
  warn "SIM_PANEL_URL not set or POST failed; showing status on ${DISPLAY_MINI_ID} instead"
fi
status_html=$(cat <<HTML
<!doctype html><html><head><meta charset="utf-8"><title>Pi-Ops First Light</title>
<style>body{margin:0;background:#282a36;color:#f8f8f2;font-family:Inter,Segoe UI,Arial;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center}h1{font-size:2.4rem;margin-bottom:0.6rem}p{margin:0;font-size:1.1rem}</style></head>
<body><div><h1>First light complete</h1><p>Displays verified • Heartbeats posted</p><p><small>Dashboard: ${GRAFANA_URL}</small></p></div></body></html>
HTML
)
status_data_uri="data:text/html;base64,$(b64enc "$status_html")"
post_device_command "$DISPLAY_MINI_ID" "{\"type\":\"display.show\",\"target\":\"mini\",\"mode\":\"url\",\"src\":\"$status_data_uri\"}"

log "Complete"
