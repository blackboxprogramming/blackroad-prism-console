# Pi 400 Admin Console Setup

The Pi 400 keyboard computer anchors the bench as the operator console. Use
this guide to turn a fresh Raspberry Pi OS install into a ready-to-go
controller for the Pi-Ops, Pi-Holo, and Pi-Sim nodes.

## 1. Prerequisites

- Raspberry Pi OS (64-bit Desktop) installed on the Pi 400.
- Network access to the Pi-Ops broker and peer devices.
- A user account with sudo access (defaults assume `pi`).

## 2. Run the configuration helper

From the repository root on the Pi 400 execute:

```bash
chmod +x scripts/configure_pi_400.sh
./scripts/configure_pi_400.sh
```

Environment variables can be supplied to override defaults:

- `PI_USER` – remote username (default `pi`).
- `PI_OPS_HOST` – hostname or IP for the Pi-Ops broker (`pi-ops.local`).
- `PI_HOLO_HOST` – hostname/IP for the hologram node (`pi-holo.local`).
- `PI_SIM_HOST` – hostname/IP for the simulator node (`pi-sim.local`).
- `MQTT_HOST` – MQTT host for shortcuts (defaults to `PI_OPS_HOST`).

### What the script configures

1. Installs handy CLI tooling (`git`, `jq`, `tmux`, `mosquitto-clients`,
   `rsync`, Python virtualenv support).
2. Generates an Ed25519 SSH key (if none exists) and writes a managed block to
   `~/.ssh/config` with shortcuts for `pi-ops`, `pi-holo`, and `pi-sim`.
3. Adds shell aliases (`ph`, `po`, `ps`, `mm`) in `~/.bash_aliases` and ensures
   `.bashrc` sources the file.
4. Drops `~/bin/pi-mqtt-watch` for quickly tailing MQTT topics on the broker.

The helper is idempotent — rerunning it updates the managed blocks in-place
without duplicating configuration.

## 3. Copy the SSH key to peer devices

After the script completes, push the public key to each device so the aliases
work without passwords:

```bash
ssh-copy-id pi@pi-ops.local
ssh-copy-id pi@pi-holo.local
ssh-copy-id pi@pi-sim.local
```

Substitute hostnames if you provided overrides.

## 4. Verify shortcuts

Open a new terminal (or `source ~/.bash_aliases`) and check:

```bash
ph   # should SSH into the holo node
po   # should SSH into the ops broker
ps   # should SSH into the simulator
mm   # should tail all MQTT topics via mosquitto_sub
pi-mqtt-watch sim/output  # scoped MQTT watcher helper
```

## 5. Optional tweaks

- Add `~/bin` to `PATH` if it is not already present (`echo 'export PATH="$HOME/bin:$PATH"' >> ~/.profile`).
- Set up `tmux` default sessions or drop dotfiles into `~/share` over the Samba
  share created on Pi-Ops.
- If the console will manage additional nodes, extend the managed block in
  `~/.ssh/config` by rerunning the helper with updated hostnames.

With these steps the Pi 400 is ready to run bench bring-up tasks, monitor MQTT
traffic, and drive the rest of the stack with minimal friction.
