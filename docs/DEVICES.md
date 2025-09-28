# Device Inventory

The device registry is stored in [`data/admin/devices.json`](../data/admin/devices.json) and is surfaced over `/api/admin/devices/*`. Each record tracks ownership, posture, and whether the hardware is physically attached to the backplane.

| Device ID     | Hardware          | Role               | Owner | Attached | Notes |
| ------------- | ----------------- | ------------------ | ----- | -------- | ----- |
| `pi-01`       | Raspberry Pi 5    | Emotion LED agent  | Ops   | ✅       | Hosts the LED ring and the local operator console account.
| `jetson-01`   | Jetson Orin Nano  | LLM / display GPU  | ML    | ✅       | Drives the main HDMI panel and coordinates inference jobs.
| `display-mini`| Pi SPI display    | Status panel       | Ops   | ✅       | 2.8" SPI panel wired into `pi-01` for mini status readouts.
| `display-main`| HDMI monitor      | Primary display    | Ops   | ✅       | Main wall display connected to `jetson-01`.

## Verification checklist

1. **Fetch registry state.** Ensure every entry reports `"attached": true` and a recent `lastSeen` timestamp.
   ```sh
   curl -fsS http://127.0.0.1:4000/api/admin/devices/list | jq
   ```
2. **Confirm telemetry.** Devices should appear under the public `/api/devices` endpoint with recent telemetry payloads.
   ```sh
   curl -fsS http://127.0.0.1:4000/api/devices | jq '.items[] | {id, last_seen, role}'
   ```
3. **Physical spot-check.** Verify USB/HDMI/SPI cables are seated and the LED ring on `pi-01` responds to a manual command.
   ```sh
   curl -fsS -H "Content-Type: application/json" \
     -d '{"type":"led.emotion","emotion":"ok","ttl_s":10}' \
     http://127.0.0.1:4000/api/devices/pi-01/command
   ```
4. **Display wake check.** Confirm both displays react to the wake command.
   ```sh
   for dev in display-mini display-main; do
     curl -fsS -H "Content-Type: application/json" \
       -d '{"type":"display.wake","ttl_s":5}' \
       "http://127.0.0.1:4000/api/devices/${dev}/command";
   done
   ```

## Operator account on the Pi

Create and maintain a dedicated `operator` user on `pi-01` so remote staff can administer peripherals without sharing the default `pi` login.

```sh
sudo adduser --gecos "BlackRoad Operator" operator
sudo usermod -aG sudo,gpio,i2c,spi operator
sudo install -d -m 700 -o operator -g operator /home/operator/.ssh
sudo tee /home/operator/.ssh/authorized_keys >/dev/null <<'KEY'
ssh-ed25519 AAAA... operator@blackroad
KEY
sudo chown operator:operator /home/operator/.ssh/authorized_keys
```

After provisioning:

- Enable passwordless `sudo` only for required maintenance commands (prefer command-specific entries in `/etc/sudoers.d/operator`).
- Switch to the account and validate device control scripts:
  ```sh
  sudo -iu operator
  systemctl --user status pi-led.service
  ```
- Confirm the account can reach the backplane API via `curl http://127.0.0.1:4000/api/health`.
