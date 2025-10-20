# BlackRoad.io — Dependency & Ops Bundle

Date: 2025-08-22

Requires Node.js 20 or later. If you're bootstrapping a Red Hat Enterprise Linux
(or CentOS Stream) host, follow the step-by-step guide in
[`docs/rhel-node-web-console.md`](docs/rhel-node-web-console.md) to enable the
Cockpit web console and install Node.js 20 with `dnf`.

This bundle is a **drop-in helper** to resolve “missing dependencies etc.” without requiring
connector access. Push it into your working copy, then run one script on the server to scan
your API, install missing npm packages, set up env defaults, and (optionally) boot a local
LLM stub on port **8000** if none is running.

> **Heads-up from the maintainer:** I'm still getting everything set up and I'm honestly not a
> strong coder yet. Thank you for your patience if anything here is rough around the edges —
> I'm doing my best and truly sorry for any bumps along the way.
## Note on GitHub Copilot agent UI

The Codespaces chat quick-actions are provided by GitHub Copilot's agent features and are
controlled by the Copilot service (not repo files). See `COPILOT_SETUP.md` and
`.github/copilot-instructions.md` for guidance to enable and tune Copilot agent behavior.

**What’s included**

- `ops/install.sh` — one-shot setup for `/srv/blackroad-api` (or detected API path)
- `tools/dep-scan.js` — scans JS/TS for `require()`/`import` usage and installs missing packages
- `tools/verify-runtime.sh` — quick health checks (API on 4000, LLM on 8000)
- `srv/blackroad-api/.env.example` — sample env for your Express API
- `srv/blackroad-api/package.json.sample` — a safe starter if your API has no package.json
- `srv/lucidia-llm/` — minimal FastAPI echo stub (only used if you don’t already run an LLM on 8000)
- `srv/lucia-llm/` — same stub (duplicate dir name for compatibility with earlier scripts)

## Financial Close & Controls Quickstart

This repo includes a deterministic offline Record-to-Report layer. See
`docs/close-process.md` and run for example:

```
python -m cli.console close:cal:new --period 2025-09 --template configs/close/template.yaml
```
## Strategy & OKR Governance

Minimal offline tooling to manage objectives, bets, scorecards, reviews, trade-offs, and memos.

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

## Supply Chain & Finance Twin

```
python -m cli.console sop:reconcile --demand samples/generated/supply/demand.csv --supply samples/generated/supply/capacity.csv --policy configs/sop/policy.yaml
python -m cli.console inv:simulate --params configs/supply/inventory.yaml --horizon 90
python -m cli.console log:optimize --demand artifacts/sop/allocations.csv --lanes fixtures/supply/lanes.csv --constraints configs/supply/log_constraints.yaml
python -m cli.console procure:award --demand artifacts/sop/allocations.csv --suppliers fixtures/procure/suppliers.csv --policy configs/procure/policy.yaml
python -m cli.console wc:simulate --demand artifacts/sop/allocations.csv --awards artifacts/procure/award.json --log artifacts/supply/log_plan_*/plan.json --terms configs/finance/terms.yaml
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

## Mining progress & leaderboards

Track miner activity, crown trophy holders, and celebrate "green wins" with the
new leaderboard tooling bundled in this repo:

1. Log each mined block in [`logs/blocks.csv`](logs/blocks.csv). Keep the header
   row and append one line per block with the timestamp, block ID, miner name,
   energy usage (kWh), and fees earned (USD).
2. Refresh the leaderboard outputs by running:
   ```bash
   python3 scripts/build_leaderboards.py
   ```
   This generates `leaderboard.md` for humans and
   `leaderboard_snapshot.json` for downstream tools.
3. Tweak thresholds or rename trophies via
   [`config/leaderboard_config.json`](config/leaderboard_config.json). The
   script merges missing keys with sensible defaults, so only override what you
   need.

Every push that touches the CSV, config, or script automatically rebuilds the
leaderboard through the `leaderboard-refresh` GitHub Action to keep things
up-to-date.

## Developing with VS Code and Docker on macOS

## Developing with VS Code and Docker on macOS

1. Start [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac/).
2. Install [Visual Studio Code](https://code.visualstudio.com/) and the **Dev Containers** extension.
3. Open this repository in VS Code and select **Reopen in Container** to use `.devcontainer/devcontainer.json`.
4. Once the container is running, use the integrated terminal to run commands like `npm install`, `npm run lint`, or `npm test`.

---

## Performance

```bash
python -m cli.console bench:run --name "Treasury-BOT" --iter 30 --warmup 5
python -m cli.console slo:report
python -m cli.console slo:gate --fail-on regressions
```

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
# The middleware stack must expose the raw JSON payload (e.g., `express.raw({ type: 'application/json' })`)
# ahead of the route so Stripe signature verification can read `req.rawBody`.
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

---

## Visual Hardware Guides

- [Pepper's Ghost Cube Calibration](docs/guides/peppers-ghost-calibration.md) — 5-minute tune-up checklist for crisp, centered holographic projections.

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

## Unified Sync Pipeline

Use `scripts/blackroad_sync.sh` to drive a chat-style deployment flow.
Example:

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
needed.

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

## Financial Close & Controls

Run an offline monthly close:

```bash
python -m cli.console close:cal:new --period 2025-09 --template configs/close/template.yaml
python -m cli.console close:jrnl:propose --period 2025-09 --rules configs/close/journals/accruals.yaml
python -m cli.console close:jrnl:post --period 2025-09
python -m cli.console close:recon:run --period 2025-09 --fixtures fixtures/finance/recons
python -m cli.console close:flux --period 2025-09 --prev 2025-08 --py 2024-09 --threshold 10
python -m cli.console close:sox:add --period 2025-09 --control C-REV-01 --path artifacts/close/REV/cut.md
python -m cli.console close:sox:check --period 2025-09
python -m cli.console close:packet --period 2025-09
python -m cli.console close:sign --period 2025-09 --role CFO --as-user U_CFO
```

## PLM & Manufacturing Ops

```
python -m cli.console plm:items:load --dir fixtures/plm/items
python -m cli.console plm:bom:load --dir fixtures/plm/boms
python -m cli.console plm:bom:explode --item PROD-100 --rev A --level 2
python -m cli.console plm:bom:where-used --component COMP-1
```

## Training & Enablement Hub Quickstart

```bash
python -m cli.console learn:courses:load --dir configs/enablement/courses
python -m cli.console learn:courses:list --role_track "Solutions Engineer"
```

## Integration Security Playbook

For guidance on connecting Slack, Asana, GitLab, GitHub, Discord, Airtable, and other
automation bots to the BlackRoad Prism Console, review
[`INTEGRATIONS_SECURITY.md`](./INTEGRATIONS_SECURITY.md). The playbook documents
hardening steps for key management, OAuth scopes, monitoring, and incident response so
that integrations remain auditable and compliant.
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
## AIOps & Self-Healing Quickstart

```bash
python -m cli.console aiops:correlate
python -m cli.console aiops:plan --correlations artifacts/aiops/correlations_*.json
python -m cli.console aiops:execute --plan artifacts/aiops/plan.json --dry-run
python -m cli.console aiops:canary --base artifacts/healthchecks/CoreAPI/baseline.json --canary artifacts/healthchecks/CoreAPI/latest.json
python -m cli.console aiops:baseline:record && python -m cli.console aiops:drift:check
python -m cli.console aiops:budget --service CoreAPI --window 30d && python -m cli.console aiops:window --service CoreAPI --action remediate
## Samples & Pipelines Quickstart

```bash
make samples
python -m pipelines.finance_margin_pipeline
python -m pipelines.reliability_pipeline
```

## Cookbook Index

See [cookbook/README.md](cookbook/README.md) for 25 example tasks. Run any recipe via:

```bash
python -m cli.console cookbook:run --name <slug>
```

## Fuzzing & Goldens

Property-based fuzz tests live under `tests/fuzz`. Regenerate golden artifacts offline:

```bash
make goldens
## Board & IR Quickstart

Run common investor relations workflows:

```
python -m cli.console ir:kpi:compute --period 2025Q3
python -m cli.console ir:kpi:signoff --kpi revenue --period 2025Q3
python -m cli.console ir:kpi:approve --kpi revenue --period 2025Q3 --as-user U_CFO
python -m cli.console ir:guidance --period 2025Q4 --assumptions configs/ir/assumptions.yaml
python -m cli.console ir:earnings:build --period 2025Q3 --as-user U_IR
python -m cli.console board:pack --month 2025-09
```
## Policy Enforcement
Runtime tasks and bot responses are checked by a central policy layer. Violations such as forbidden intents, oversized context, or missing risks raise `BotExecutionError` and block execution.

## PII Redaction & Lineage
All task context and bot outputs are scrubbed for emails, phone numbers, SSNs and credit cards. Values are replaced with deterministic tokens like `{{REDACTED:email:hash8}}`. Data lineage traces are recorded to `orchestrator/lineage.jsonl` linking datasets and artifacts.

## Integrations (Stubs)
Offline importers for Salesforce, SAP, ServiceNow and Workday read fixtures under `fixtures/` and write normalized rows to `artifacts/imports/*.json` via the CLI.

## Observability
Run `python -m cli.console obs:report` to generate a local dashboard under `artifacts/observability/` summarising bot usage, policy violations, redactions and lineage coverage.

## Dry-Run Mode
Pass `--dry-run` to any CLI command to skip writing artifacts. The action still executes but prints `DRY-RUN: no artifacts written`.
## Air-Gapped Install

1. `python build/repro/compile_deps.py`
2. `python build/offline_wheels.py`
3. `bash install/offline_install.sh`
4. `python -m cli.console integrity:verify`
5. `bash install/offline_uninstall.sh`

### Integrity Verification

```
python build/signing/verify_wheels.py
python build/attest.py && gpg --verify dist/attestation.json.asc dist/attestation.json
```
## Codex Prompt Site Quickstart

```
npm --prefix sites/codex-prompts run dev
```

Serves the markdown prompts directory as a Next.js site with plain-text API and sitemap.

## Artifact Release

```
python -m tools.artifacts artifacts/data.json --schema schemas/routing.schema.json --tag
```

Generates a deterministic hash for the artifact and optionally tags the current commit.
## Digital Twin

Deterministic offline tooling for operations.

Mini tour:

1. `python -m cli.console twin:checkpoint --name demo`
2. `python -m cli.console twin:list`
3. `python -m cli.console twin:replay --from "2025-01-01" --to "2025-01-02" --mode verify`
4. `python -m cli.console twin:stress --profile default --duration 10`
5. `python -m cli.console twin:compare --left artifacts/runA --right artifacts/runB`
## R&D Lab Quickstart

```bash
python -m cli.console rnd:idea:new --title "Example" --problem x --solution y --owner U1 --tags demo
## Runbook DSL

Runbooks live in `prism/runbooks` and describe how Prism diagnoses and fixes issues.
Each YAML file contains match signals, questions, optional probes, and a plan that
produces diffs and commands.

Example:

```yaml
id: python-importerror
title: "Python: ModuleNotFoundError / ImportError"
```

Use the 20-question wizard in Developer Mode to walk through questions, run probes,
and synthesize a fix plan.

### Tests

Run server runbook tests:

```bash
pnpm -C apps/prism/server test:runbooks
```

Run web runbook tests:

```bash
pnpm -C apps/prism/apps/web test:runbooks
### Legal Ops & Contracts Quickstart

```bash
python -m cli.console legal:contract:new --type MSA --counterparty "Acme Ltd."
python -m cli.console legal:assemble --template MSA --options configs/legal/options/acme.yml --out artifacts/legal/C001_v1.md
python -m cli.console legal:redline --old artifacts/legal/C001_v1.md --new artifacts/legal/C001_v2.md
python -m cli.console legal:approve:request --id C001 --for-role CFO && python -m cli.console legal:contract:approve --id C001 --as-user U_CFO
python -m cli.console legal:obligations:extract --id C001 && python -m cli.console legal:obligations:list --due-within 90
python -m cli.console legal:export:screen --partner P001 --order samples/sales/order_lines.json
```
## RBAC
Roles and permissions are defined in `config/users.json`. Use `--as-user` to run CLI commands as a specific user.

## Approvals
Approval rules live in `config/approvals.yaml`. Use `approval:create`, `approval:list`, and `approval:decide` to manage approvals.

## Audit
All orchestrator events are signed and stored in `orchestrator/memory.jsonl`. Verify integrity with `audit:verify`.

## Docker
Build and run the console in a container:

```sh
make build
make run
```

Mount a volume at `/app/data` to persist data.

> Security note: the signing key in `config/dev_signing_key.txt` is for development only and should be rotated for production.
## Marketing & Content Ops Quickstart

```bash
python -m cli.console mkt:segments:build --config configs/marketing/segments.yaml
python -m cli.console mkt:leadscore --config configs/marketing/lead_score.yaml
python -m cli.console mkt:attr --model linear
## Master Data & Governance Quickstart

```bash
python -m cli.console mdm:stage --domain account --file fixtures/mdm/account.csv
python -m cli.console mdm:match --domain account --config configs/mdm/match_account.yaml
python -m cli.console mdm:golden --domain account --policy configs/mdm/survivorship_account.yaml
python -m cli.console mdm:dq --domain account --config configs/mdm/dq_account.yaml
```
