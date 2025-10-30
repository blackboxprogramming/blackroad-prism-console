# Pi ↔ DigitalOcean Connectivity Checklist

Use this runbook when you need to confirm that a Raspberry Pi on your LAN can reach (and be reached from) a DigitalOcean droplet. Work through the sections in order; each one keeps the blast radius small and builds confidence before you expose anything to the public internet.

> **Placeholder reminder:** Commands that show values inside angle brackets (for example, `<pi-public-ip>` or `<ssh-port>`) are placeholders. Replace them with your real addresses, hostnames, or ports and do **not** type the `<` and `>` characters. If it helps, assign an environment variable first (e.g., `PI_IP=192.168.4.42`) and run commands such as `curl -I http://$PI_IP/` or `ssh -vvv piuser@$PI_IP -p 2222`.

> **Safety first:** Only run commands you understand. Redact private data before sharing outputs outside your environment.

## 1. Baseline checks on the Pi
Perform these steps from a terminal on the Pi (directly or over LAN SSH).

1. **Confirm interfaces and routes**
   ```bash
   ip addr show
   ip route show
   ```
   *Expect:* the primary LAN interface shows an address such as `192.168.x.x`, and a default route points at your router (e.g., `via 192.168.4.1`).

2. **Verify SSH is listening**
   ```bash
   sudo ss -tuln | grep -E '(:22|ssh)'
   sudo lsof -i -P -n | grep LISTEN
   ```
   *Expect:* an entry for `0.0.0.0:22` or `:::22` (or your custom SSH port). Use `sudo netstat -tulpen | grep ssh` if you prefer the legacy toolset.

3. **Check SSH service health and recent logs**
   ```bash
   sudo systemctl status ssh --no-pager
   sudo journalctl -u ssh -n 200 --no-pager
   ```
   *Expect:* `Active: active (running)` and no repeated authentication failures or bind errors.

4. **Spot-check with `btop` (optional but handy)**
   * In the **Processes** view, confirm an `sshd` process is present.
   * In the **Network** view, ensure traffic levels look normal (steady RX/TX, no runaway processes).

## 2. Confirm reachability from the local LAN
Run the following from another device on the same subnet (for example, your laptop on 192.168.4.0/24).

1. **Ping the Pi**
   ```bash
   ping -c 5 192.168.4.<pi-host>
   ```
   *Expect:* Replies with low latency. Packet loss indicates LAN or firewall issues.

2. **Attempt a verbose SSH connection**
   ```bash
   ssh -vvv piuser@192.168.4.<pi-host>
   ```
   *Expect:* The verbose log should reach `Authentication succeeded` (or show exactly where it stalls if not).

3. **Inspect the ARP cache**
   ```bash
   arp -a
   ```
   *Expect:* An entry mapping the Pi’s IP to its MAC address. If missing, the device may be offline or isolated.

## 3. Review router / NAT configuration
Use the router UI (commonly `http://192.168.4.1`) to confirm:

- Static DHCP lease or reservation for the Pi.
- Port-forward rule exposing TCP 22 (or the custom SSH port) to the Pi, if you require inbound access from the internet.
- UPnP disabled or monitored, and no blanket DMZ rules unintentionally exposing the Pi.

If UI access is unavailable, collect public IP data from the Pi:
```bash
curl -s https://ifconfig.me
```
Match this with what external services report (see step 4) to understand whether you are behind carrier-grade NAT or directly exposed.

## 4. Validate from the DigitalOcean droplet
All commands below run on the droplet.

1. **Record the droplet’s public IP (sanity check)**
   ```bash
   curl -s https://ifconfig.me
   ```

2. **Ping the Pi’s public presence** (only if a public IP or dynamic DNS entry exists)
   ```bash
   ping -c 4 <pi-public-ip-or-ddns>
   ```
   *Expect:* Replies confirm basic reachability. Timeouts often mean missing port-forwarding or upstream filtering.

3. **Probe the SSH port**
   ```bash
   nc -zv <pi-public-ip> <port>
   # or
   nmap -p <port> <pi-public-ip>
   ```
   *Expect:* `succeeded` / `open` indicates the port is reachable. `timed out` or `filtered` points to firewall/NAT issues.

4. **Attempt SSH with verbose logging**
   ```bash
   ssh -vvv piuser@<pi-public-ip> -p <forwarded-port>
   ```
   *Expect:* Successful authentication, or detailed logging that highlights where the handshake fails (e.g., key exchange, authentication, or connection timeout).

> **Note:** Direct access to private addresses such as `192.168.x.x` from the droplet only works if a VPN or tunnel connects the environments.

## 5. Alternative: Reverse SSH tunnel (no port forwarding)
If inbound access is blocked by ISP policies or double NAT, create a reverse tunnel from the Pi to the droplet:

```bash
ssh -fN -R 2222:localhost:22 your_droplet_user@<droplet-ip>
# On the droplet:
ssh -p 2222 piuser@localhost
```

To keep the tunnel alive across reboots or drops, pair it with `autossh` or a systemd service.

## 6. Examine authentication and connection logs

- **On the Pi:**
  ```bash
  sudo tail -n 200 /var/log/auth.log
  # or
  sudo journalctl -u ssh -n 200
  ```
  Look for repeated failures, key mismatches, or banner warnings.

- **On the droplet:**
  Review `ssh -vvv` output for clues and inspect `journalctl -u sshd` if the droplet also runs an SSH server.

## 7. Security hardening must-haves
When exposing the Pi to the internet, apply these defenses before opening ports:

- Enforce SSH keys and disable passwords in `/etc/ssh/sshd_config`:
  ```
  PasswordAuthentication no
  PermitRootLogin no
  ```
- Restrict inbound access with a host firewall:
  ```bash
  sudo ufw allow from <droplet-ip> to any port <ssh-port>
  sudo ufw enable
  sudo ufw status verbose
  ```
- Deploy `fail2ban` (or similar) to throttle brute-force attempts.
- Rotate SSH keys if compromise is suspected, and keep the OS patched.

## 8. What to capture for remote troubleshooting
Collecting the following snippets makes remote assistance easier (scrub sensitive data first):

- `ip addr show` and `ip route show` from the Pi.
- Output of `sudo ss -tuln | grep ssh` (or `netstat`) from the Pi.
- A single `ssh -vvv` session log (Pi ↔ droplet or LAN client ↔ Pi).
- Confirmation of router port-forwarding (screen capture or textual summary).
- Port probe results from the droplet (`nc` or `nmap`).

Following this checklist gives you a fast, low-risk way to isolate connectivity gaps while keeping the Pi hardened when you do choose to expose it.
