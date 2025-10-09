# BlackRoad.io — Dependency & Ops Bundle
Date: 2025-08-22

This bundle is a **drop-in helper** to resolve “missing dependencies etc.” without requiring
connector access. Push it into your working copy, then run one script on the server to scan
your API, install missing npm packages, set up env defaults, and (optionally) boot a local
LLM stub on port **8000** if none is running.

**What’s included**
- `ops/install.sh` — one-shot setup for `/srv/blackroad-api` (or detected API path)
- `tools/dep-scan.js` — scans JS/TS for `require()`/`import` usage and installs missing packages
- `tools/verify-runtime.sh` — quick health checks (API on 4000, LLM on 8000)
- `srv/blackroad-api/.env.example` — sample env for your Express API
- `srv/blackroad-api/package.json.sample` — a safe starter if your API has no package.json
- `srv/lucidia-llm/` — minimal FastAPI echo stub (only used if you don’t already run an LLM on 8000)
- `srv/lucia-llm/` — same stub (duplicate dir name for compatibility with earlier scripts)

> Nothing here overwrites your existing code. The scripts are defensive: they detect paths,
> **merge** deps, and only generate files if missing.

---

## Quick start
**On your workstation**
1) Unzip this at the **root of your working copy** (where your repo root lives).
2) Commit and push.

**On the server**
```bash
cd /path/to/your/working/copy
sudo bash ops/install.sh
bash tools/verify-runtime.sh
```

- The installer will:
  - Locate your API (prefers `./srv/blackroad-api`, then `/srv/blackroad-api`, else searches for `server_full.js`)
  - Create `package.json` if missing and **auto-install** any missing npm packages it finds
  - Create `.env` from the example if missing and generate strong secrets
  - Ensure your SQLite file exists (defaults to `blackroad.db` inside the API dir if `DB_PATH` is not set)
  - Check if `127.0.0.1:8000` is serving `/health`. If not, it prints a one-liner to launch the stub.

## Git workflow
When you're ready to share changes:

1. Stage your updates:
   ```bash
   git add -A
   ```
2. Commit with a clear message:
   ```bash
   git commit -m "feat: describe your change"
   ```
3. Push the branch:
   ```bash
   git push origin <branch-name>
   ```
4. Open a Pull Request and review the CI results.

## Developing with VS Code and Docker on macOS
1. Start [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac/).
2. Install [Visual Studio Code](https://code.visualstudio.com/) and the **Dev Containers** extension.
3. Open this repository in VS Code and select **Reopen in Container** to use `.devcontainer/devcontainer.json`.
4. Once the container is running, use the integrated terminal to run commands like `npm install`, `npm run lint`, or `npm test`.

---

## Notes & assumptions
- Stack recorded in memory (Aug 2025): SPA on `/var/www/blackroad/index.html`, Express API on port **4000**
  at `/srv/blackroad-api` with SQLite; LLM service on **127.0.0.1:8000**; NGINX proxies `/api` and `/ws`.
- This bundle does **not** ship `node_modules/` (native builds vary by machine). Instead, it generates
  and installs what’s actually needed by **scanning your sources**.
- If your API already has `package.json`, nothing is overwritten; missing deps are added.
- If you maintain your API directly under a different path, run the scanner manually, e.g.:
  ```bash
  node tools/dep-scan.js --dir /path/to/api --save
  ```

If anything looks off, run `bash tools/verify-runtime.sh` and share the output.

## Subscribe API

Environment variables for Stripe integration:

- `STRIPE_PUBLIC_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER_MONTHLY`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_INFINITY_MONTHLY`
- `STRIPE_PRICE_STARTER_YEARLY`
- `STRIPE_PRICE_PRO_YEARLY`
- `STRIPE_PRICE_INFINITY_YEARLY`
- `STRIPE_PORTAL_RETURN_URL` (optional)

Example calls:

```bash
curl http://localhost:4000/api/subscribe/config
curl -H "Cookie: brsid=..." http://localhost:4000/api/subscribe/status
curl -X POST http://localhost:4000/api/subscribe/checkout \
  -H "Content-Type: application/json" \
  -d '{"planId":"pro","interval":"month"}'
curl -H "Cookie: brsid=..." http://localhost:4000/api/subscribe/portal
# Webhooks are received at /api/stripe/webhook and must include the Stripe signature header.
```
## Unified Sync Pipeline

Use `scripts/blackroad_sync.sh` to drive a chat-style deployment flow.
Example:

```bash
./scripts/blackroad_sync.sh "Push latest to BlackRoad.io"
```

The script also understands:
- "Refresh working copy and redeploy"
- "Rebase branch and update site"
- "Sync Salesforce -> Airtable -> Droplet"

It pulls from GitHub, triggers connector webhooks, updates a Working Copy checkout, and
executes a remote refresh command on the droplet.
### BlackRoad Sync CLI
`codex/tools/blackroad_sync.py` scaffolds a chat-friendly pipeline that mirrors
commands like "Push latest to BlackRoad.io" or "Refresh working copy and
redeploy".  Each sub-command currently logs the intended action:

```bash
python codex/tools/blackroad_sync.py push
python codex/tools/blackroad_sync.py refresh
python codex/tools/blackroad_sync.py rebase
python codex/tools/blackroad_sync.py sync
```

Extend the script with real webhooks, Slack posts, or droplet deployments as
needed.

---

## Codex Deploy Flow

`codex/jobs/blackroad-sync-deploy.sh` provides a chat-focused pipeline tying
together git pushes, connector syncs, working-copy refreshes and server deploys.
Typical usage:

```bash
# commit local changes, push and deploy to the droplet
bash codex/jobs/blackroad-sync-deploy.sh push-latest "chore: update"

# refresh the iOS Working Copy checkout and redeploy
bash codex/jobs/blackroad-sync-deploy.sh refresh

# rebase current branch onto origin/main then deploy
bash codex/jobs/blackroad-sync-deploy.sh rebase-update

# run Salesforce → Airtable → Droplet syncs
bash codex/jobs/blackroad-sync-deploy.sh sync-connectors
```

It honours environment variables like `DROPLET_HOST`,
`WORKING_COPY_PATH`, and `SLACK_WEBHOOK` for remote access and
status notifications.

# BlackRoad Prism Console

A comprehensive digital platform for BlackRoad's web presence, featuring both blackroad.io and blackroadinc.us websites.

## Quick Start

1. **Setup the environment:**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Start the services:**
   ```bash
   docker-compose up -d
   ```

3. **Access the websites:**
   - http://blackroad.io
   - http://blackroadinc.us
   - http://localhost

## Architecture

- **Frontend**: Static HTML/CSS/JS served by nginx
- **Backend**: Node.js API server (optional)
- **Reverse Proxy**: nginx for routing and static file serving
- **Containerization**: Docker Compose for easy deployment

## Development

### Local Development Setup

1. **Prerequisites:**
   - Docker and Docker Compose
   - Node.js (for API development)
   - sudo access (for /etc/hosts modification)

2. **File Structure:**
   ```
   /workspaces/blackroad-prism-console/
   ├── public/                 # Static website files
   │   ├── css/               # Stylesheets
   │   ├── js/                # JavaScript files
   │   ├── images/            # Images and assets
   │   └── index.html         # Main entry point
   ├── api/                   # API server (Node.js)
   ├── nginx.conf             # nginx configuration
   ├── docker-compose.yml     # Container orchestration
   └── setup.sh              # Environment setup script
   ```

3. **Making Changes:**
   - Edit files in the `public/` directory for frontend changes
   - Edit files in the `api/` directory for backend changes
   - Restart containers after configuration changes: `docker-compose restart`

### Commands

- **Start services:** `docker-compose up -d`
- **Stop services:** `docker-compose down`
- **View logs:** `docker-compose logs -f`
- **Restart nginx:** `docker-compose restart nginx`
- **Rebuild containers:** `docker-compose up -d --build`

## Features

- **Multi-domain support**: Serves both blackroad.io and blackroadinc.us
- **Responsive design**: Mobile-friendly interface
- **Fast loading**: Optimized static assets with caching
- **SEO ready**: Proper meta tags and structure
- **Security headers**: Basic security configurations
- **API ready**: Optional backend API integration

## Troubleshooting

### Common Issues

1. **Domains not resolving:**
   - Ensure /etc/hosts entries are added (run `./setup.sh`)
   - Check entries: `cat /etc/hosts | grep blackroad`

2. **nginx not starting:**
   - Check configuration: `docker-compose config`
   - View logs: `docker-compose logs nginx`

3. **Port conflicts:**
   - Ensure ports 80 and 3000 are available
   - Stop other services using these ports

4. **Permission errors:**
   - Ensure proper file permissions: `chmod -R 755 public/`
   - Run setup script: `./setup.sh`

### Logs

- **nginx access logs:** `tail -f logs/nginx/access.log`
- **nginx error logs:** `tail -f logs/nginx/error.log`
- **Container logs:** `docker-compose logs -f [service_name]`

## Production Deployment

For production deployment:

1. **SSL/HTTPS Setup:**
   - Add SSL certificates
   - Update nginx.conf with SSL configuration
   - Redirect HTTP to HTTPS

2. **Performance Optimization:**
   - Enable gzip compression (already configured)
   - Optimize images and assets
   - Configure proper caching headers

3. **Security:**
   - Update security headers
   - Configure firewall rules
   - Regular security updates

## Support

For issues or questions:
- Check the troubleshooting section above
- Review container logs
- Ensure all prerequisites are installed
- Verify Docker and Docker Compose are running properly
## Codex Pipeline

This repo ships with a chat-first deployment helper at
`codex/tools/blackroad_pipeline.py`. The script accepts plain‑English
commands and orchestrates git pushes, connector stubs and droplet
deploys in one flow:

```bash
python3 codex/tools/blackroad_pipeline.py "Push latest to BlackRoad.io"
python3 codex/tools/blackroad_pipeline.py "Refresh working copy and redeploy"
```

It relies on environment variables for remote hosts and tokens
(`GIT_REMOTE`, `DROPLET_HOST`, `SLACK_WEBHOOK`).
This scaffold is intentionally clean and compact so you can drop in your own logic fast.

## Codex Deployment

A helper script `scripts/blackroad_codex.sh` provides a chat-like interface for common deployment actions:

```bash
scripts/blackroad_codex.sh push
scripts/blackroad_codex.sh deploy
scripts/blackroad_codex.sh refresh
scripts/blackroad_codex.sh rebase
scripts/blackroad_codex.sh sync
```

Set `REMOTE`, `BRANCH`, and `DROPLET_HOST` to customize targets. Provide `SLACK_WEBHOOK` to post updates.
## BlackRoad Sync & Deploy

Run `scripts/blackroad_sync.sh` to push the latest changes to GitHub and roll them out to the droplet. The script accepts natural language commands, for example:

```bash
scripts/blackroad_sync.sh "Push latest to BlackRoad.io"
scripts/blackroad_sync.sh "Refresh working copy and redeploy"
```

Set `WORKING_COPY_SSH`, `DROPLET_SSH`, and optionally `SLACK_WEBHOOK` environment variables before running. Logs are written to `blackroad_sync.log`.
## Codex Sync & Deploy

An initial scaffold for the end-to-end BlackRoad deployment flow lives in
`scripts/blackroad_sync.py`. The helper currently exposes three
subcommands:

```bash
# Push local commits to GitHub and trigger connector jobs
python3 scripts/blackroad_sync.py push

# Update an iOS Working Copy clone
python3 scripts/blackroad_sync.py refresh-working-copy --path /path/to/clone

# Pull latest code and restart services on the droplet
python3 scripts/blackroad_sync.py deploy --host user@droplet
```

The script only prints the operations it would perform, acting as a
placeholder for future automation.
---

## Codex Deploy Flow

`codex/jobs/blackroad-sync-deploy.sh` provides a chat-focused pipeline tying
together git pushes, connector syncs, working-copy refreshes and server deploys.
Typical usage:

```bash
# commit local changes, push and deploy to the droplet
bash codex/jobs/blackroad-sync-deploy.sh push-latest "chore: update"

# refresh the iOS Working Copy checkout and redeploy
bash codex/jobs/blackroad-sync-deploy.sh refresh

# rebase current branch onto origin/main then deploy
bash codex/jobs/blackroad-sync-deploy.sh rebase-update

# run Salesforce → Airtable → Droplet syncs
bash codex/jobs/blackroad-sync-deploy.sh sync-connectors
```

It honours environment variables like `DROPLET_HOST`,
`WORKING_COPY_PATH`, and `SLACK_WEBHOOK` for remote access and
status notifications.

- **/geodesic**: Compute Fubini–Study distance `d_FS = arccos(|⟨ψ|φ⟩|)` and sample the **CP² geodesic** points between |ψ₀⟩ and |ψ₁⟩.

## Codex Sync Helper

Use `scripts/blackroad_sync.py` for chat-driven CI/CD tasks. It can commit and
push changes, refresh a working copy, rebase branches, or stub out connector
sync jobs.

Examples:

```bash
scripts/blackroad_sync.py push -m "feat: update site"
scripts/blackroad_sync.py refresh
scripts/blackroad_sync.py sync-connectors
```
