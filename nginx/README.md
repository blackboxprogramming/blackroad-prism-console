# blackroad.io Nginx Baseline

- Canonical vhost file: `/etc/nginx/sites-available/blackroad.conf`
- Enabled symlink: `/etc/nginx/sites-enabled/blackroad.conf`
- `nginx.conf` includes: `sites-enabled/*.conf`
- SPA root: `/var/www/blackroad`
- SPA fallback: `try_files $uri /index.html`
- `/api/*` and `/socket.io/*` → `proxy_pass http://127.0.0.1:4000`
- WebSocket headers enabled (`Upgrade` + `Connection`)
- SSL certs: `/etc/letsencrypt/live/blackroad.io/{fullchain.pem, privkey.pem}`
- Port 80 = `default_server`
  - `/health` returns JSON: `{"ok":true,"service":"nginx","port":80}`
  - everything else redirects to HTTPS
- Port 443
  - `/health` returns JSON: `{"ok":true,"service":"nginx","port":443}`
  - serves SPA at `/var/www/blackroad`
  - `/api/*` proxies to Node API on `:4000`
  - `/api/health` returns JSON from `blackroad-api`
- gzip enabled for text assets
- All duplicate vhosts removed; this file is the single source of truth

Expected curls:
- `curl -sS http://127.0.0.1/health` → JSON ok
- `curl -sS https://blackroad.io/health` → JSON ok
- `curl -sS https://blackroad.io/api/health` → JSON from blackroad-api

## Quick symlink sanity check

Broken vhost symlinks in `/etc/nginx/sites-enabled/` cause partial config loads and intermittent 502s.
Run the bundled helper to verify every enabled site links back to `sites-available` before reloading nginx:

```bash
./scripts/checks.sh
```

Or manually:

1. Inspect symlinks
   ```bash
   ls -l /etc/nginx/sites-enabled/
   ```
2. Remove or recreate any entries that do **not** point into `/etc/nginx/sites-available/`.
3. Validate and reload
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

_Last updated on 2025-09-11_
