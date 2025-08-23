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

