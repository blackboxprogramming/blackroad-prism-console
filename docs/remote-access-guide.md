# Remote Access Quickstart

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
