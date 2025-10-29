# Pi ↔ Droplet Connectivity Runbook

## 0. Decide your path first (pick one)

- **A. Port forward** on your router: `<public-ip>:<high-port> → Pi:22`
- **B. VPN** (WireGuard/Tailscale): both peers get routable private VPN IPs
- **C. Reverse SSH tunnel**: Pi dials out to droplet, droplet connects back via localhost

Everything else depends on that choice.

---

## 1. On the Pi (local)

```bash
# Interfaces + route
ip addr show
ip route show

# SSH listening + service health
sudo ss -tuln | grep -E '(:22|ssh)'
sudo systemctl status ssh --no-pager
sudo journalctl -u ssh -n 200 --no-pager
```

✅ Expect a 192.168.4.x address and a default route.
✅ `sshd` listening (often `0.0.0.0:22`).

**Hardening (do this if you plan to expose SSH):**

```bash
sudoedit /etc/ssh/sshd_config
# set:
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
# then:
sudo systemctl restart ssh
```

---

## 2. From your LAN laptop (same 192.168.4.x)

```bash
ping -c 3 192.168.4.<pi>
ssh -vvv pi@192.168.4.<pi>   # verbose handshake
arp -a | grep 192.168.4.<pi> # MAC seen?
```

This proves *local* reachability and SSH auth.

---

## 3. Make the Pi reachable from the droplet (choose A, B, or C)

### A. Port forward on router

- Forward a **high port** (e.g. 22222) on your public IP → `192.168.4.<pi>:22`.
- From **Pi**, confirm the router’s public IP:

  ```bash
  curl -s https://ifconfig.me
  ```
- From **droplet**:

  ```bash
  nc -zv <router-public-ip> 22222     # "succeeded" means TCP open
  ssh -p 22222 -vvv pi@<router-public-ip>
  ```

  ⚠️ ICMP ping often blocked; TCP probes (`nc`, `ssh -vvv`) are what matter.

### B. VPN (cleanest)

- Give Pi and droplet VPN IPs (e.g. WireGuard 10.8.0.2 and 10.8.0.3).
- From **droplet**:

  ```bash
  ping -c 3 10.8.0.2
  ssh -vvv pi@10.8.0.2
  ```

### C. Reverse SSH tunnel (no port-forwarding needed)

On **Pi**:

```bash
ssh -fN -R 2222:localhost:22 <user>@<droplet-ip>
# -R exposes droplet:2222 → Pi:22
```

On **droplet**:

```bash
nc -zv localhost 2222
ssh -p 2222 pi@localhost
```

Make it persistent with autossh + systemd if you like.

---

## 4. Interpret logs correctly

**On the Pi** (Debian/Raspbian):

```bash
sudo tail -n 200 /var/log/auth.log | egrep 'sshd|Failed|Accepted'
# or
sudo journalctl -u ssh -n 200
```

- `Failed password` with `PasswordAuthentication no` = expected if someone tried passwords (they’ll always fail).
- `Accepted publickey for pi from <ip>` = success with keys.
- `Connection closed by authenticating user` or timeouts = network/NAT issue.

**On the droplet**: rely on `ssh -vvv` lines:

- Stalls at `Connecting to …` → routing/firewall.
- Reaches `SSH2_MSG_KEXINIT sent/received` then dies → DPI / middlebox / incompatible ciphers.
- Gets to `Offering public key` then `Permission denied` → wrong key or `authorized_keys` perms.

---

## 5. Optional observability (Prometheus/Grafana)

- Export **Pi sshd metrics** via node_exporter + simple log exporter, or just scrape `sshd` connection counts with a script.
- In Grafana, graph:

  - TCP SYNs to your SSH port
  - Accepted sessions over time
  - Fail2ban bans / iptables counters

- Caveat: dashboards won’t replace the ground truth in `auth.log` + `ssh -vvv`. Treat them as trend views.

---

## 6. Quick "sanity matrix"

| Test                                        | Where   | Good signal                     | If bad, suspect                                  |
| ------------------------------------------- | ------- | ------------------------------- | ------------------------------------------------ |
| `ssh -vvv pi@192.168.4.<pi>`                | LAN     | Key offered, auth prompt        | Pi sshd down, local firewall, wrong IP           |
| `nc -zv <public-ip> 22222`                  | Droplet | "succeeded"                     | Router forwarding, ISP blocks, double NAT        |
| `ssh -p 22222 pi@<public-ip>`               | Droplet | `kex` then `Accepted publickey` | Key/permissions, sshd config                     |
| `ssh -p 2222 pi@localhost` (reverse tunnel) | Droplet | Success                         | Tunnel not up, -R blocked by droplet sshd config |

---

## About your simulated notes

- **"Password verification unsuccessful"** twice: consistent with `PasswordAuthentication no`. That’s a *pass* if you’re enforcing keys.
- **"piratasetuptrace after initial pinger (22 attempts)"**: packet counts don’t prove SSH reachability; a completed `kex` in `ssh -vvv` or an `Accepted publickey` in `auth.log` does.
- **"Online ping service"**: useful only for *your public IP* and only if ICMP isn’t filtered. It can’t reach 192.168.x.x, and many networks drop ICMP anyway.

---

If you want, drop the outputs of:

- `ss -tuln | grep ssh` on the Pi
- The last ~30 lines of `ssh -vvv` from the droplet (redact hostnames if you want)
- Your chosen path (A/B/C) and whether the TCP probe (`nc -zv …`) succeeds

I’ll read the tea leaves and point you straight at the failing link.
