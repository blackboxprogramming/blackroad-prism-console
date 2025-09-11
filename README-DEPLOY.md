
## Auto-deploy secrets (GitHub → Settings → Secrets and variables → Actions)
- `BR_DEPLOY_SECRET` — shared bearer token for `/api/deploy/hook` and `/api/deploy/trigger`
- `BR_DEPLOY_URL` — optional override of the deploy webhook URL
- `CF_ZONE_ID` / `CF_API_TOKEN` — optional Cloudflare purge credentials
- `SLACK_WEBHOOK_URL` — optional Slack notification URL

## Legacy SSH deploy secrets
- `SERVER_HOST` — your server or domain (e.g., blackroad.io)
- `SERVER_USER` — SSH user with permission to write to `/opt/blackroad` and restart `blackroad-api`
- `SSH_KEY` — private key **text** (RSA/ED25519). Use `SSH_KEY_PATH` instead if you prefer a file path.
- `SSH_PORT` — optional (defaults to 22)

## Paths (already set in workflow)
- `DEPLOY_ROOT=/opt/blackroad/releases`
- `WEB_PATH=/var/www/blackroad`
- `API_PATH=/srv/blackroad-api`

## Health endpoints (external)
- `HEALTH_URL=https://blackroad.io/health`
- `API_HEALTH_URL=https://blackroad.io/api/health`

## What happens on push to `main`
1. Install deps, lint, test, build.
2. Assemble `release.tar.gz` with:
   - `web/` → built assets from `web/dist` or `web/build` (or `web/public` fallback).
   - `api/` → your API source (no `node_modules`).
3. Upload artifact, then deploy:
   - Upload tarball → extract to `/opt/blackroad/releases/<SHA>/`
   - Point `/var/www/blackroad` and `/srv/blackroad-api` at the new release (symlinks)
   - `npm ci --omit=dev` for API, restart `blackroad-api`
   - Keep last 3 releases
   - Check `/health` and `/api/health`
   - Rollback automatically if either fails.

## One-time server prep (optional)
SSH to the server and run:
```sh
bash -lc 'curl -fsSL https://raw.githubusercontent.com/<your-org>/<your-repo>/main/scripts/bootstrap_server.sh | sh'

Or copy scripts/bootstrap_server.sh and run it.
```

Local dry run of deploy script

If you have the tarball locally:

SERVER_HOST=blackroad.io SERVER_USER=ubuntu SSH_KEY_PATH=~/.ssh/id_ed25519 \
DEPLOY_ROOT=/opt/blackroad/releases WEB_PATH=/var/www/blackroad API_PATH=/srv/blackroad-api \
./scripts/deploy.sh release.tar.gz

Rollback notes

The script auto-selects the previous directory in /opt/blackroad/releases/ and switches symlinks back, then restarts blackroad-api.

Monorepo notes
•If your SPA is at web/, it will be built and packaged automatically.
•If your API is at api/, its source is packaged (prod deps installed on the server).
•If you keep everything at root, the workflow still attempts sensible fallbacks.

---

### That’s it
This **one** pipeline handles **build → artifact → SSH deploy → atomic switch → health → auto‑rollback** and retains the **last 3** releases. If you want me to tailor it to a specific repo layout (e.g., exact web/api paths, extra build steps, Prisma migrations, PM2 instead of systemd), say the word and I’ll adapt the files accordingly.

_Last updated on 2025-09-11_
