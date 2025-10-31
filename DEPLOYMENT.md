# BlackRoad deployment playbook

This playbook documents the fully automated release flow for the Prism console
and captures the handful of manual escape hatches that remain. It mirrors the
`environments/*.yml` manifests so humans and bots follow the same source of
truth when promoting changes.

## Branch model & merge queue

- `main` is the only production source of truth. `staging` mirrors production
  for pre-production testing and is promoted via pull requests from `main`.
- Every change must enter the merge queue by applying the `automerge` label.
  The `🤖 Auto-merge` workflow flips GitHub’s native auto-merge toggle so the
  queue serialises incompatible work.
- The scheduled **Branch Hygiene** workflow (`.github/workflows/branch-hygiene.yml`)
  runs weekly (or on demand) and deletes merged branches automatically using the
  updated `cleanup-dead-branches.sh` script. Provide
  `BRANCH_CLEANUP_TOKEN` when a dedicated bot token is required.
- Avoid long-lived feature branches—rebase them frequently or close them once
  the preview environment catches regressions.

## Preview gating (per pull request)

- `.github/workflows/preview.yml` provisions an isolated ECS/Fargate stack for
  each pull request, wiring ALB listener rules and Route53 aliases under
  `pr-<n>.dev.blackroad.io`.
- `.github/workflows/preview-containers.yml` builds a GHCR image per PR,
  publishes SBOM and Grype scan artifacts, and posts docker run instructions on
  the pull request.
- `.github/workflows/preview-containers-cleanup.yml` and
  `preview-frontend-host.yml` remove registry tags and optional frontend-only
  preview services on close.
- These jobs are required checks for every pull request; do not merge without a
  green preview stack.

## Staging handshake

- The staging branch (`staging`) represents the pre-production environment.
- `.github/workflows/pages-stage.yml` rebuilds the stage proof artifact whenever
  `staging` updates or on a daily cron. The workflow now targets the staging
  branch instead of `main` so pre-production approvals gate the release.
- `.github/workflows/stage-stress.yml` remains an opt-in load test that operators
  can trigger with `STRESS=true` before promoting to production.
- Staging automation, Terraform roots, and health checks are captured in
  `environments/staging.yml`.

## Production promotion

- `.github/workflows/blackroad-deploy.yml` runs on every push to `main` (modern
  path) and exposes `workflow_dispatch` inputs for legacy SSH deploys. It builds
  the SPA, calls the deploy webhook, verifies `/healthz` + `/api/version`, and
  purges Cloudflare when necessary before posting Slack notifications.
- `deploy-canary.yml` and `deploy-canary-ladder.yml` provide progressive
  delivery options before flipping all traffic. Reference
  `environments/production.yml` for required variables and secrets.
- Change management continues to run through `.github/workflows/change-approve.yml`
  with CAB approval documented in the production manifest. Execute
  `runbooks/examples/infra_release_policy.yaml` during releases so rollback and
  comms stay coordinated.

## Environment manifests

Authoritative configuration lives under `environments/`:

- `preview.yml` — preview automation inputs, Terraform backends, and required
  pull-request checks.
- `staging.yml` — staging branch triggers, proof artifact workflow, and planned
  ECS wiring.
- `production.yml` — production workflows, change management gates, and health
  checks.

Update the manifests whenever domains, Terraform state, workflows, or approval
paths change. Release tooling consumes these files directly.

## Observability & health

- `/healthz`, `/health.json`, and `/api/version` endpoints are validated as part
  of the production workflow.
- Grafana, Prometheus, and Alertmanager definitions live in
  `deploy/k8s/monitoring.yaml`. Apply the manifest via `kubectl` for full-stack
  telemetry.
- Preview jobs hit `/healthz/ui` automatically; staging smoke tests (`curl -fsS
  https://stage.blackroad.io/health.json`) are linked from the manifest.

## Legacy fallbacks

Automation should cover the vast majority of releases. When manual access is
required, fall back to the documented scripts:

- Legacy webhook configuration and GitHub App manifests live in
  `srv/blackroad-api/`. Keep `BR_DEPLOY_SECRET`, `BR_DEPLOY_URL`, and the GitHub
  App webhook secret in sync.
- `.github/workflows/blackroad-deploy.yml` exposes `target=legacy-ssh` for SSH
  hosts. Supply `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_KEY`, and optional
  `DEPLOY_PORT` secrets when invoking the manual path.
- `cleanup-dead-branches.sh` can still be run locally. Set `AUTO_APPROVE=true`
  to bypass prompts when running in automation or pass a different base branch
  with `BASE_BRANCH=origin/staging`.

### Fallback: DigitalOcean droplet quickstart

For one-off experiments without touching the automated pipeline, provision a
droplet and follow these steps:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt-get update && apt-get install -y docker-compose-plugin git

git clone https://github.com/blackboxprogramming/blackroad-prism-console.git
cd blackroad-prism-console
cp .env.production .env
# Generate new secrets: openssl rand -hex 32

docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml logs -f
```

Expose `/healthz` through the bundled Caddy configuration or install Nginx per
the historical instructions if you need HTTPS quickly. Treat this path as a
temporary escape hatch; the automated workflows remain the source of truth for
production.
