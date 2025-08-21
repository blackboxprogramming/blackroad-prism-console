# BlackRoad.io — Ops Quickstart

## Local (Docker)

```bash
bash scripts/bootstrap-site.sh
# Site → http://localhost:8080
# API  → http://localhost:4000/api/health.json
```

## Server (NGINX)

1. Copy build to `/var/www/blackroad`:
   ```bash
   rsync -avz sites/blackroad/dist/ user@server:/var/www/blackroad/
   ```
2. Install config and reload:
   ```bash
   sudo cp nginx/blackroad.io.conf /etc/nginx/sites-available/blackroad.io
   sudo ln -sf /etc/nginx/sites-available/blackroad.io /etc/nginx/sites-enabled/blackroad.io
   sudo nginx -t && sudo systemctl reload nginx
   ```
3. Ensure API bridge is running on `:4000` (see `docker-compose.prism.yml`).

## CI

- GitHub Actions:
  - `site-build.yml` builds & uploads site artifact.
  - `site-e2e.yml` runs Playwright tests.
  - Optional Pages deploy is wired; swap to NGINX/Caddy deployment as desired.

## Watchdog

Install & enable the periodic watchdog to validate API, NGINX config, and site root. Auto-restarts the API if unhealthy.

```bash
sudo bash scripts/install-watchdog.sh
journalctl -u blackroad-watchdog.service -n 50 --no-pager
```
