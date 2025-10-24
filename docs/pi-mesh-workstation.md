# Raspberry Pi Mesh Workstation Bring-up

This script automates the "many-windows" Raspberry Pi workstation recipe so you can
bootstrap each node with a single command.

## Prerequisites
- Raspberry Pi OS / Debian-based distro with `apt` available
- User account with sudo rights
- Tailscale already installed and logged in (`tailscale up --ssh ...`)

## Usage
```bash
bash pi/mesh_workstation_bringup.sh \
  --node alice=100.66.58.5 \
  --node lucidia=100.120.10.8 \
  --node gamma \
  --ssh-user pi
```

Run the script on every Pi. Pass `--barrier-role server` on the machine that will host
the Barrier server; leave the default `client` role elsewhere.

The script will:
1. Update apt metadata and install Barrier, WayVNC, tmux, and Syncthing
2. Create/refresh a user-level WayVNC systemd service bound to the chosen port (default `5900`)
3. Attempt to enable and start WayVNC immediately
4. Print Barrier follow-up steps and ready-to-copy Termius entries for `alice`, `lucidia`, and `gamma`

### Options
- `--barrier-role <client|server>` – configure Barrier role hints in the summary output
- `--vnc-port <port>` – change the WayVNC listen port (default `5900`)
- `--ssh-user <user>` – override the SSH username shown in the Termius entries
- `--node <name[=ip]>` – add/update node definitions (repeat for each Pi)
- `--skip-termius` – skip Termius entry printing when you only need to update packages/services

### Example output
```
[12:00:01] Ensuring Barrier, WayVNC, tmux, and Syncthing are installed...
[12:00:15] Created WayVNC user service at /home/pi/.config/systemd/user/wayvnc.service
[12:00:15] WayVNC user service enabled and started.
Barrier setup next steps:
  • Launch Barrier and select the "client" role on this host.
  • For clients, connect to the Barrier server using its Tailscale hostname (e.g., alice).
  • For the main workstation, arrange screen positions in the Barrier UI.

Termius quick-add entries:
Host: alice
  Hostname: 100.66.58.5
  User: pi
  Port: 22
```

After running the script you can immediately connect with Barrier and VNC across your
Tailscale mesh, reusing the hostnames printed for Termius or any other SSH client.
