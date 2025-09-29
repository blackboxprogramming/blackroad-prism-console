#!/usr/bin/env bash
set -euo pipefail

# Bootstrap script for installing the BlackRoad agent skeleton on a Raspberry Pi.
# The script lays down an always-on telemetry watcher with a Jetson peer check.

LOG_PATH="/var/log/blackroad-agent.log"
JETSON_HOST="jetson.local"
AGENT_BIN="/usr/local/bin/blackroad-agent.sh"

sudo tee "$AGENT_BIN" >/dev/null <<'AGENT'
#!/usr/bin/env bash
set -euo pipefail

LOG=/var/log/blackroad-agent.log
JETSON="${JETSON_OVERRIDE:-jetson.local}"

log() { echo "[$(date +%F %T)] $*" | tee -a "$LOG"; }

while true; do
  # Collect telemetry from the Pi
  pi_temp=$(vcgencmd measure_temp 2>/dev/null || echo "n/a")

  # Probe the Jetson companion if reachable
  jetson_temp=$(ssh -o ConnectTimeout=2 jetson@"$JETSON" "vcgencmd measure_temp" 2>/dev/null || echo "n/a")

  log "Pi temp=$pi_temp | Jetson temp=$jetson_temp"

  # Placeholder health check for the embedded AI runtime
  if [ -x /usr/local/bin/blackroad-ai ]; then
    /usr/local/bin/blackroad-ai --health >>"$LOG" 2>&1 || true
  fi

  sleep 60
done
AGENT

sudo chmod +x "$AGENT_BIN"

# Provision the systemd unit so the agent runs on boot.
sudo tee /etc/systemd/system/blackroad-agent.service >/dev/null <<'UNIT'
[Unit]
Description=BlackRoad Telemetry Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/local/bin/blackroad-agent.sh
Restart=always
RestartSec=5
User=root

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable blackroad-agent.service
sudo systemctl restart blackroad-agent.service

cat <<INFO
BlackRoad agent installed.
- Log file: $LOG_PATH
- Service: blackroad-agent.service
INFO
