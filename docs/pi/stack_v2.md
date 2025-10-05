# Pi Stack v2 Upgrade Notes

This bundle includes the automation for promoting the bench setup into a fully networked "living system". Use it in tandem with the existing Day 1 setup guide.

## Display Config Templates

Templates for /boot/config.txt live in `pis/display-configs/`:

- `720x720_config.txt` for the square hologram panel.
- `1600x600_config.txt` for the ultrawide dashboard panel.
- `1024x600_config.txt` for the 9.3" status panel.

Copy the desired block into `/boot/config.txt`, reboot, and then tune brightness/rotation as needed.

## Heartbeat Services

`pis/heartbeat.py` emits temperature, uptime, load averages, memory, and disk data to MQTT. It publishes to `system/heartbeat/<node>` every 30 seconds by default.

Installer scripts:

- `scripts/push_pi_holo.sh` uploads the heartbeat publisher to `pi-holo.local` and enables the service.
- `scripts/push_pi_sim.sh` does the same for `pi-sim.local`.
- Both wrap `scripts/install_pi_node.sh`, which creates a virtualenv, installs dependencies, and sets up the systemd unit.

The Pi-Ops node collects these heartbeats via `pis/pi-ops/hb_log.py`. Push `scripts/install_pi_ops.sh` and `pis/pi-ops/hb_log.py` to `pi-ops.local`, then run the installer to provision Mosquitto, Samba, and the logging service.

## macOS Control Server

Run `python agent/mac/api.py` inside your agent virtualenv to expose:

- `GET /ping` – health check used during bring-up.
- `POST /holo/text` – send validated text to the hologram display.
- `POST /sim/panel` – update the simulator panel payload.

The server uses the MQTT payload validator in `agent/mac/validators.py` and the publisher helper in `agent/mac/mqtt.py` to lint every message before it leaves the laptop.

## Validation Flow

Every command passes through the Pydantic validators before it hits MQTT. Any malformed payload yields a `400` with validation errors so you can fix the command before it reaches hardware.

## Quick Start

1. Copy `scripts/install_pi_ops.sh` and `pis/pi-ops/hb_log.py` to the Pi-Ops host and run the installer.
2. Execute `scripts/push_pi_holo.sh` and `scripts/push_pi_sim.sh` from your workstation to deploy heartbeat publishers.
3. Activate the agent virtualenv on macOS and start `agent/mac/api.py` (FastAPI + Uvicorn) to drive `/holo/text` and `/sim/panel` endpoints.

This aligns with the "fast path" checklist in the release notes.
