# BlackRoad.io — Dependency & Ops Bundle

Date: 2025-08-22

Requires Node.js 20 or later.

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

1. Unzip this at the **root of your working copy** (where your repo root lives).
2. Commit and push.

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
redeploy". Each sub-command currently logs the intended action:

```bash
python codex/tools/blackroad_sync.py push
python codex/tools/blackroad_sync.py refresh
python codex/tools/blackroad_sync.py rebase
python codex/tools/blackroad_sync.py sync
```

Extend the script with real webhooks, Slack posts, or droplet deployments as
needed. For example, `scripts/blackroad_ci.py` will post connector sync
updates to Slack when a `SLACK_WEBHOOK_URL` environment variable points to an
incoming webhook.

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

This repository hosts experimental tooling and prototypes for BlackRoad.io.

## CI/CD orchestrator

`scripts/blackroad_ci.py` provides a scaffold for the end-to-end workflow
connecting Codex, GitHub, external connectors and the deployment droplet. The
script accepts natural language style commands and performs placeholder actions
for now.

Examples:

```bash
python scripts/blackroad_ci.py "Push latest to BlackRoad.io"
python scripts/blackroad_ci.py "Refresh working copy and redeploy"
python scripts/blackroad_ci.py "Rebase branch and update site"
python scripts/blackroad_ci.py "Sync Salesforce -> Airtable -> Droplet"
```

Connector and deployment steps are stubs; configure environment variables and
extend the script to interact with real services.

# BlackRoad Prism Console

This repository contains assorted utilities for the BlackRoad project.

## Codex Pipeline Scaffold

The `scripts/blackroad_pipeline.py` script offers a chat-oriented control
surface that maps high level phrases to underlying actions. It currently
wraps common Git operations and prints placeholders for connector sync,
working copy refresh and droplet deployment.

### Example

```bash
python scripts/blackroad_pipeline.py "Push latest to BlackRoad.io"
```

The phrases recognised by the controller can be listed by invoking the
script with an unknown command.

## Sync & Deploy

## Codex Sync/Deploy

An experimental control surface lives at `codex/tools/blackroad_pipeline.py`.
It accepts chat-style commands and orchestrates a stubbed pipeline spanning
GitHub commits, connector sync, Working Copy refresh, and droplet deployment.

```bash
python codex/tools/blackroad_pipeline.py "Push latest to BlackRoad.io" -m "chore: sync"
```

The script only logs each step today; extend the placeholders with real
connectors, OAuth, and deployment hooks to enable end-to-end automation.

Additional operational docs live in the [`docs/`](docs) folder.

Use the `bin/blackroad-sync` script to push code and refresh the live site end to end.

```bash
# Push commits, trigger connector jobs, refresh the Working Copy, and redeploy the droplet
bin/blackroad-sync push

# Refresh deployment without new commits
bin/blackroad-sync refresh

# Rebase with main, push, and redeploy
bin/blackroad-sync rebase
```

The script relies on environment variables like `DROPLET_HOST` and `WORKING_COPY_HOST` to reach remote hosts.

Additional operational docs live in the [`docs/`](docs) folder.

## Codex Sync Script

The repository includes a minimal scaffold to experiment with the end-to-end
flow described in the BlackRoad deployment docs. The helper accepts natural
language commands and turns them into git/deploy operations.

```bash
python scripts/blackroad_sync.py "Push latest to BlackRoad.io"
```

Other examples:

- `python scripts/blackroad_sync.py "Refresh working copy and redeploy"`
- `python scripts/blackroad_sync.py "Rebase branch and update site"`
- `python scripts/blackroad_sync.py "Sync Salesforce → Airtable → Droplet"`

The script currently prints placeholder actions; extend the functions to hook
into real connectors and infrastructure.

## Bot Commands (ChatOps)

- `/deploy blackroad <channel> [provider]` — deploy canary/beta/prod
- `/rollback blackroad <channel> [steps] [provider]` — revert to earlier build
- `/blog new "Title"` — scaffold blog post PR
- `/promote prod` — open staging→prod PR
- `/toggle <flag> on|off` — set feature flags in `.github/feature-flags.yml`
- `/install all` — run universal installer
- `/fix <freeform prompt>` — dispatch AI Fix with your prompt

## Agents Overview

- **Auto-Heal**: reacts to failing workflows and dispatches **AI Fix**.
- **AI Fix**: runs Codex/LLM prompts, formats, builds, opens PRs.
- **AI Sweeper**: nightly formatter/linter; opens PR if needed.
- **Labeler/Stale/Lock**: repo hygiene.
- **Auto-merge**: merges labeled PRs when checks pass.
- **CodeQL/Snyk/Scorecard**: security analysis.

## Deployment

Run the scaffolded end-to-end sync script to push local changes and deploy them
to the live environment:

```bash
python scripts/blackroad_sync.py
```

The script pushes to GitHub, fans out to connector webhooks, refreshes an iOS
Working Copy checkout and issues a remote deploy on the droplet when configured
via environment variables.

Additional operational docs live in the [`docs/`](docs) folder.

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

## Backbone Equations Reference

See [docs/blackroad-equation-backbone.md](docs/blackroad-equation-backbone.md) for a curated list of one hundred foundational equations across mathematics, physics, computer science, and engineering.

_Last updated on 2025-09-11_

## Prism Developer Mode

Start the development server:

```bash
cd prism/server
npm install
npm run dev
```

Run the web console with Approvals panel:

```bash
cd apps/prismweb
npm install
npm run dev
```

## Console Quickstart

```bash
pip install -r requirements.txt
python -m cli.console bot:list
python -m cli.console task:create --goal "Build 13-week cash view"
python -m cli.console task:route --id <ID> --bot "Treasury-BOT"
```

## Add a new bot

Create `bots/my_bot.py`:

```python
from orchestrator.base import BaseBot
from orchestrator.protocols import Task, BotResponse

class MyBot(BaseBot):
    """
    MISSION: ...
    INPUTS: ...
    OUTPUTS: ...
    KPIS: ...
    GUARDRAILS: ...
    HANDOFFS: ...
    """
    name = "My-BOT"
    mission = "..."

    def run(self, task: Task) -> BotResponse:
        ...
```

## Data Layer Quickstart

Build and query the offline lake:

```
python -m cli.console index:build
python -m cli.console sem:metrics
```

