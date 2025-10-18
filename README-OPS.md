# Ops quickstart
Bridge runs on :4000; nginx routes `/api` and `/ws`. Static web artifacts publish through GitHub Pages while containerised services land on AWS ECS Fargate.

## Environment map

| Environment | Domains | Primary workflow | Notes |
| --- | --- | --- | --- |
| Preview (`pr`) | `https://dev.blackroad.io`, `https://pr-<n>.dev.blackroad.io` | `.github/workflows/preview-env.yml` | Spins up ephemeral ECS services + ALB rules per pull request. Terraform config lives in `infra/preview-env/` and the manifest is documented in `environments/preview.yml`. |
| Staging (`stg`) | `https://stage.blackroad.io` | `.github/workflows/pages-stage.yml` | Builds and archives the static site proof artifact. API wiring is planned; see `environments/staging.yml` for current status. |
| Production (`prod`) | `https://blackroad.io`, `https://www.blackroad.io`, `https://api.blackroad.io` | `.github/workflows/blackroad-deploy.yml` | GitHub Pages publishes the marketing site; API gateway will promote via the same workflow once the ECS module is enabled. Full manifest: `environments/production.yml`. |

Reference the manifests whenever DNS, workflow, or Terraform parameters change so automation and runbooks stay aligned.

Infrastructure pushes now run through the codified policy gate in
`runbooks/examples/infra_release_policy.yaml`. The runbook checks that the
Change Advisory Board workflow has approved the change, triggers the
`.github/workflows/blackroad-deploy.yml` release, and falls back to
`infra_release_rollback` so `scripts/rollback.sh` is exercised when health
checks fail. Keep both runbooks handy during CAB reviews.

## Deployment workflows

### Preview (per PR)
- Triggered automatically on pull request open/update via `preview-env.yml`.
- Builds the image, applies Terraform (`infra/preview-env`), and comments with the preview URL.
- Closing the PR or re-running the `destroy` job removes ALB rules, target groups, ECS services, and Route53 aliases.
- Smoke test: `curl -sSfL https://pr-<n>.dev.blackroad.io/healthz/ui` (already executed in the workflow).

### Staging
- Pushes to `main` touching `blackroad-stage/**` or manual dispatch run `pages-stage.yml`.
- Generates a daily proof + `health.json` for `stage.blackroad.io` and uploads the artifact (no automatic publish step yet).
- Use the artifact for QA sign-off or handoff to downstream deploy automation.

### Production
- `blackroad-deploy.yml` runs on every `main` push and exposes a `workflow_dispatch` entry for manual redeploys.
- Builds the SPA, triggers the deploy webhook (`BR_DEPLOY_SECRET` / `BR_DEPLOY_URL`), then lets downstream infra promote the build.
- API and NGINX remain accessible over SSH while we finish migrating to ECS; scripts live under `scripts/` for TLS + health.

## Rollback and forward

| Scope | Rollback | Forward fix |
| --- | --- | --- |
| Preview env | Re-run the workflow with the prior commit (Actions → `preview-env` → `Run workflow` with old SHA) or close the PR to tear everything down. | Push a new commit or dispatch the workflow with the hotfix branch; Terraform will update in place. |
| Staging site | Download the previous `blackroad-stage` artifact from Actions and republish manually if needed. | Re-run `pages-stage.yml` after merging the fix or push a corrective commit to `blackroad-stage/**`. |
| Production site/API | Trigger `BlackRoad • Deploy` with `workflow_dispatch`, selecting the last known-good `main` commit. For API hosts still on SSH, run `.github/workflows/prism-ssh-deploy.yml` or `scripts/nginx-ensure-and-health.sh` from the bastion. | Merge the fix and re-run `BlackRoad • Deploy`; ECS workloads will follow once the production module is switched on. |

Document every rollback/forward action in the incident log and update the corresponding manifest to reflect configuration changes.

## Routine health & cleanup

- API health checks: `https://api.blackroad.io/health` (prod) and `http://127.0.0.1:4000/api/health` (bridge).
- Static site health endpoints: `https://blackroad.io/healthz`, `https://stage.blackroad.io/health.json`.
- Server helpers:
  ```sh
  scripts/nginx-ensure-and-health.sh
  scripts/nginx-enable-tls.sh   # optional TLS helper
  ```
- Cleanup broom: `usr/local/sbin/br-cleanup.sh` audits API, Yjs, bridges, nginx, IPFS, etc. Modes:
  ```sh
  sudo br-cleanup.sh audit | tee /srv/ops/cleanup-audit.txt
  sudo br-cleanup.sh fix   | tee /srv/ops/cleanup-fix.txt
  sudo br-cleanup.sh prune | tee /srv/ops/cleanup-prune.txt
  ```
  Install the systemd service + timer from `etc/systemd/system/` and enable `br-cleanup-nightly.timer` for scheduled runs. Optional sudoers entry: `etc/sudoers.d/br-cleanup`.

## References

- Environment manifests: `environments/*.yml`
- Preview Terraform stack: `infra/preview-env/`
- Reusable module: `modules/preview-env/`
- Deployment workflows: `.github/workflows/preview-env.yml`, `pages-stage.yml`, `blackroad-deploy.yml`, `prism-ssh-deploy.yml`

_Last updated on 2025-10-06_
