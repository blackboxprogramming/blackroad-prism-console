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
This guide walks through preparing multiple Raspberry Pi hosts (Pi 5s, Pi 400) so they can be reached from macOS, other Pis, and iPhone/iPad clients. It focuses on verifying network reachability, setting up SSH keys, and establishing convenient shortcuts for the shared `lucidia` account across devices.

## 1. Map the network and hosts

1. Give every Raspberry Pi either a DHCP reservation or a static IP address so it does not change between reboots. Record the hostname/IP for each system.
2. On each Pi, confirm its identity: `hostname`, `hostname -I`, and `whoami` (expect `lucidia`).
3. Make sure the SSH daemon is enabled: `sudo systemctl status ssh` should report `active (running)`. If not, enable it with `sudo systemctl enable --now ssh`.
4. (Optional) Enable mDNS/Bonjour names so macOS and iOS can resolve `pi-hostname.local`: `sudo systemctl enable --now avahi-daemon`.

## 2. Prepare SSH credentials once

- Use key-based auth so you can reach every device without typing a password. From a trusted Mac or Pi, run `ssh-keygen -t ed25519 -C "lucidia@macbook"` and press **Enter** to accept the default location (`~/.ssh/id_ed25519`).
- Copy the resulting public key to each Pi: `ssh-copy-id lucidia@<pi-host-or-ip>`.
- For devices where `ssh-copy-id` is not available, append the public key manually: `cat ~/.ssh/id_ed25519.pub | ssh lucidia@<pi> 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'`.
- Add the private key to your agent so future connections reuse it: `ssh-add ~/.ssh/id_ed25519` (macOS) or ensure `ssh-agent` runs on your Pi sessions.

## 3. Create per-host shortcuts on macOS

1. Open **Terminal** and edit `~/.ssh/config` (`nano ~/.ssh/config`).
2. Add one stanza per host so you can type short aliases:
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
       IdentityFile ~/.ssh/id_ed25519

   Host pi400
       HostName pi400.local
       User lucidia
   ```
3. Test connectivity with the alias (`ssh pi5-a`). If you are prompted to trust the fingerprint, verify it on the Pi with `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub`.
4. To copy files quickly between Macs and Pis, use `scp pi5-a:/path/to/file ~/Downloads/`.

## 4. Reach one Pi from another (Pi 400 ↔ Pi 5)

- Use the same `ssh lucidia@<target-host>` command between Pis once keys are shared. To avoid repeated prompts, copy the same `~/.ssh` folder (private keys **excluded**) or replicate the public key using `ssh-copy-id` from each Pi.
- If you need a graphical session, enable VNC from `sudo raspi-config` → **Interface Options** → **VNC** and connect using a VNC viewer.
- Keep each Pi updated so OpenSSH stays compatible: `sudo apt update && sudo apt full-upgrade`.

## 5. Connect from iPhone or iPad

1. Install an SSH client such as **Blink Shell**, **Termius**, or **Shelly**.
2. Import the same Ed25519 private key:
   - AirDrop the `id_ed25519` file from your Mac (Blink/Termius will store it in their secure keychain).
   - Or, if generated inside the iOS app, export the new public key and append it to each Pi's `authorized_keys` (Termius and Blink can do this over iCloud or clipboard).
3. Create host entries matching the aliases you use on macOS (`pi5-a`, `pi400`). Provide the username `lucidia`, hostname/IP, and key.
4. On the first connection, accept the host fingerprint. Subsequent sessions can reuse saved aliases.
5. For reliable roaming connections, enable **mosh** in Blink Shell and install `mosh` on each Pi (`sudo apt install mosh`).

## 6. Verify connectivity and diagnose issues

- From macOS or another Pi, ping the host: `ping -c 4 <pi-ip>` to confirm basic reachability.
- Check that port 22 is open: `nc -vz <pi-ip> 22` (macOS) or `nmap -p 22 <pi-ip>`.
- If SSH is slow or failing, increase verbosity: `ssh -vvv lucidia@<pi-ip>` and review the negotiation details.
- On the Pi, inspect logs: `sudo journalctl -u ssh -f` for live output or `sudo tail -f /var/log/auth.log` for authentication events.
- Verify file permissions: `chmod 700 ~/.ssh` and `chmod 600 ~/.ssh/authorized_keys`.
- Ensure all devices share the same network or, for remote access, set up a VPN/ZeroTier/Tailscale tunnel and connect to the tunnel IP addresses.

## 7. Automate frequent tasks

- Create shell aliases or scripts for batch commands, e.g. `alias pi5='ssh pi5-a'`.
- Use `tmux` or `screen` to keep long-running sessions alive even if your client disconnects.
- Synchronize configuration across Macs and Pis with tools like `rsync` or `chezmoi` so new hosts pick up the same `~/.ssh/config` entries.
- For monitoring, schedule a simple health check (`cron` job with `ping -c 1 <pi-ip> || echo "pi5 down"`) and send alerts via email or push notifications.

This documentation is informational; it does not perform any automated attempts to reach remote devices.
