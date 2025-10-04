# Pi-Ops lucidia bridge deployment

Pi-Ops already hosts the MQTT broker and the local dashboard, so it is the
natural home for the lucidia edge bridge. The bridge can run headless on the Pi
without the Jetson being present; when the Jetson is offline the process simply
logs the traffic it would forward.

## Service layout

- **Unit name:** `lucidia-bridge.service`
- **Binary:** `/opt/lucidia/bin/lucidia-sim-bridge`
- **Working directory:** `/opt/lucidia`
- **Log location:** `/var/log/lucidia/bridge.log`
- **Socket:** `ipc:///var/run/lucidia_bridge.sock`

## Installation steps

1. Copy the compiled bridge binary to Pi-Ops:
   ```sh
   scp target/release/lucidia-sim-bridge pi-ops:/opt/lucidia/bin/
   ssh pi-ops 'sudo chown root:root /opt/lucidia/bin/lucidia-sim-bridge && sudo chmod 0755 /opt/lucidia/bin/lucidia-sim-bridge'
   ```
2. Install the systemd unit:
   ```sh
   scp ops/systemd/lucidia-bridge.service pi-ops:/etc/systemd/system/
   ssh pi-ops 'sudo systemctl daemon-reload && sudo systemctl enable --now lucidia-bridge.service'
   ```
3. Confirm the process starts and idles cleanly when the Jetson is offline:
   ```sh
   ssh pi-ops 'sudo systemctl status lucidia-bridge.service'
   ssh pi-ops 'sudo journalctl -u lucidia-bridge.service -n 50'
   ```

The default unit starts the bridge with `SIM_WRITE_ENABLED=false`, so command
traffic is read-only. Toggle the environment variable to `true` in the unit if
you need to forward commands to the Jetson-side Trick/cFS stack.

## Operational notes

- Keep Pi-Ops on the same wired VLAN as the Jetson to minimize IPC latency.
- The broker, dashboard, and bridge all watch `/var/run/lucidia_bridge.sock`; a
  tmpfiles.d rule ensures the socket directory exists at boot.
- Add Pi-Ops to the device inventory (see `data/admin/devices.json`) so the UI
  reflects the bridge host status.
- When staging updates, restart the bridge after the MQTT broker to avoid stale
  subscriptions:
  ```sh
  ssh pi-ops 'sudo systemctl restart mosquitto && sudo systemctl restart lucidia-bridge'
  ```

_Last updated on 2025-09-11_
