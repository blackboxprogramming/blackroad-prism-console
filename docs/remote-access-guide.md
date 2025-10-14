# Remote Access Quickstart

This guide outlines how to verify connectivity and connect to remote Linux hosts such as Raspberry Pi devices from different clients (iPhone, macOS, Linux).

## 1. Gather host information

1. Ensure each remote device has a static IP or resolvable hostname.
2. On each Raspberry Pi, run `hostname -I` to list IP addresses and `whoami` to confirm the username (e.g., `lucidia`).
3. Confirm the SSH service is enabled: `sudo systemctl status ssh` should show `active (running)`.

## 2. Prepare credentials

- Use SSH keys for authentication when possible.
- From a trusted machine (Mac or Pi), generate a key if needed: `ssh-keygen -t ed25519`.
- Copy the public key to each Pi: `ssh-copy-id lucidia@<pi-hostname-or-ip>`.

## 3. Connecting from macOS

1. Open **Terminal**.
2. Connect with SSH: `ssh lucidia@pi.local` or `ssh lucidia@<pi-ip>`.
3. To reach multiple devices quickly, add entries to `~/.ssh/config`:
   ```sshconfig
   Host pi5-a
       HostName 192.168.1.50
       User lucidia
   ```
4. Use `ssh pi5-a` to connect with the saved configuration.

## 4. Connecting from Raspberry Pi (Pi 400 or Pi 5)

- Use the same SSH command: `ssh lucidia@other-pi`.
- If you need remote desktop, enable VNC with `sudo raspi-config` → **Interfaces** → **VNC**.

## 5. Connecting from iPhone or iPad

1. Install a terminal/SSH client such as **Blink Shell**, **Termius**, or **Shelly** from the App Store.
2. Import your SSH key or create one within the app.
3. Create a new host profile with the Pi's IP/hostname and username `lucidia`.
4. Connect and accept the host fingerprint on first use.

## 6. Verifying connectivity

- Ping the host: `ping <pi-ip>`.
- Check open ports from macOS or Linux: `nc -vz <pi-ip> 22`.
- On the Pi, review logs if connection fails: `sudo journalctl -u ssh -f`.

## 7. Troubleshooting tips

- Ensure all devices share the same network or configure port forwarding/VPN for remote access.
- Confirm the firewall allows SSH (port 22).
- Use `ssh -v lucidia@<pi-ip>` for verbose diagnostics.
- If passwords are disabled, verify the SSH key permissions (`chmod 600 ~/.ssh/id_ed25519`).

## 8. Automation ideas

- Use `tmux` or `screen` to maintain sessions.
- Create shell aliases for frequent connections.
- Consider `mosh` for mobile connections with intermittent connectivity.

This documentation is informational; no automated attempts to reach remote devices are performed.
