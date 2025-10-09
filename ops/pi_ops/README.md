# Pi-Ops Reflex

`ops_reflex.py` is a lightweight MQTT reflex that listens to Pi-Ops heartbeat
messages and drives alerts to the holographic and simulator displays when nodes
run hot.

## Features

- Watches `system/heartbeat/<node>` topics for JSON heartbeats.
- Raises temperature alerts with per-node cooldowns and a global spam guard.
- Publishes cluster state snapshots to `ops/reflex/state`.
- Accepts live threshold updates on `ops/reflex/cmd` without restarting.

## Installation

On a Pi-Ops host, copy the reflex script and matching systemd service, install
paho-mqtt, and enable the service.

```bash
# from your workstation
scp ops/pi_ops/ops_reflex.py ops/systemd/ops_reflex.service pi@pi-ops.local:/home/pi/

# then log into the device
ssh pi@pi-ops.local <<'EOF'
sudo apt update
sudo apt install -y python3-pip
pip install --break-system-packages paho-mqtt
sudo mv /home/pi/ops_reflex.service /etc/systemd/system/ops_reflex.service
sudo systemctl daemon-reload
sudo systemctl enable --now ops_reflex
EOF
```

## Smoke Test

Use MQTT clients from any machine on the LAN.

```bash
# Watch the reflex state and alerts topics
mosquitto_sub -h pi-ops.local -t 'ops/reflex/#' -v

# Fake a hot node
mosquitto_pub -h pi-ops.local -t system/heartbeat/pi-holo -m '{"ts": 1700000000, "temp_c": 72, "uptime_s": 12345}'

# Cool it back down
mosquitto_pub -h pi-ops.local -t system/heartbeat/pi-holo -m '{"ts": 1700000005, "temp_c": 60, "uptime_s": 12350}'

# Change thresholds live (no restart)
mosquitto_pub -h pi-ops.local -t ops/reflex/cmd -m '{"set":{"TEMP_WARN_C":75,"TEMP_CLEAR_C":68}}'
```

## Next Steps

A natural extension is to add a "lost heartbeat" rule—for example, alerting if a
node goes silent for 30 seconds with a red banner and chime.
