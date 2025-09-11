# BlackRoad Sovereign Stack

This guide bootstraps a fully self-hosted Lucidia stack using only BlackRoad-controlled machines.

## Threat Model
- Assume Internet transit and DNS can disappear.
- Only BlackRoad hardware is trusted.
- All services must continue over WireGuard mesh, Tor onion, and direct IP when external services fail.

## One-shot Setup
1. Install Debian/Ubuntu minimal.
2. Copy this repo to `/srv/blackroad-prism-console`.
3. Run provisioning scripts in order:
   ```bash
   sudo bash provision/00_sys.sh
   sudo bash provision/10_pkgs.sh
   sudo bash provision/20_wireguard.sh
   sudo bash provision/30_registry.sh
   sudo bash provision/31_gitea.sh
   sudo bash provision/32_woodpecker.sh
   sudo bash provision/33_vault.sh
   sudo bash provision/34_verdaccio.sh
   sudo bash provision/35_devpi.sh
   sudo bash provision/36_apt_mirror.sh
   sudo bash provision/37_models.sh
   sudo bash provision/40_dns_auth.sh
   sudo bash provision/tor_onion.sh
   sudo bash provision/50_nginx_edge.sh
   ```
4. Import compose files and systemd units with `docker compose` and `systemctl enable --now`.

## Runbook
- `systemctl status lucidia` – check application.
- `docker compose -f compose/* up -d` – start services.
- `restic snapshots` – verify backups.
- `bash resilience/read_only_mode.sh` – serve last-good build.

## RUN THIS FIRST
```bash
sudo apt-get update && sudo apt-get install -y git
git clone https://example.com/blackroad-prism-console.git
cd blackroad-prism-console
bash provision/00_sys.sh
```

_Last updated on 2025-09-11_
