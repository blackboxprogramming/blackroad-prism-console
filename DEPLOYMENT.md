# BlackRoad deployment playbook

This guide explains how the Prism console promotes builds across preview, staging,
and production. It focuses on the automation already codified in the repository
so operators can follow the same source of truth that bots rely on.

## Environment manifests

Authoritative definitions for each footprint live in `environments/*.yml`:

- **Preview (`preview.yml`)** — ephemeral per-PR stacks on AWS ECS Fargate
  under `dev.blackroad.io`. Includes Terraform backend metadata, required
  secrets, and the GitHub workflow that provisions and tears down previews.
- **Staging (`staging.yml`)** — mirrors production infrastructure for QA. Tracks
  the GitHub Pages proof artifact job today and documents the planned ECS
  gateway wiring.
- **Production (`production.yml`)** — customer-facing domains, deploy workflows,
  Terraform backends, and approval requirements for blackroad.io.

Update these manifests whenever domains, Terraform roots, secrets, or approval
flows change. Release tooling, runbooks, and dashboards should link back to the
manifests so humans and automation stay aligned.

## Automation & workflows

GitHub Actions is the canonical deployment surface. Key workflows:

- `.github/workflows/preview.yml` — builds a PR-specific container image,
  applies the preview Terraform stack, creates load balancer rules, and comments
  with the preview URL.
- `.github/workflows/pages-stage.yml` — generates the staged proof artifact and
  uploads it for QA sign-off. Future ECS wiring for staging will reuse this
  manifest for additional services.
- `.github/workflows/blackroad-deploy.yml` — runs on pushes to `main` (or manual
  dispatch) to build the SPA, call the deploy webhook, verify health, and notify
  Slack when configured.

Secrets, variables, and health checks referenced by these workflows are
captured in the environment manifests above. When adding a new service, extend
both the manifest and the relevant workflow so deploy metadata stays in sync.

## Change management & approvals

Infrastructure-affecting intents (deploy, schema migrations, secret rotation)
require an approval token via `.github/workflows/change-approve.yml`. Each
manifest’s `change_management` section documents which runbooks and workflows
must be satisfied before promoting changes. Store the resulting token artifact
with the release so auditors can trace who approved the operation.

## GitHub App & webhook integration

The API accepts deploy commands from either the GitHub App or a bearer-secured
webhook:

1. Create or update the GitHub App using
   `srv/blackroad-api/github_app_manifest.json` as a template. Point the webhook
   to `https://blackroad.io/api/webhooks/github` using the shared secret in
   `srv/blackroad-api/.env.example`.
2. For the webhook path used by the modern workflow, supply `BR_DEPLOY_SECRET`
   and `BR_DEPLOY_URL` secrets so `blackroad-deploy.yml` can trigger
   `/api/deploy/hook`.
3. Keep `README-DEPLOY.md` updated with any additional secrets or verification
   logic so operators know which credentials are required.

## Rollback & manual operations

`README-OPS.md` contains the canonical rollback/forward matrix, health endpoints,
and scripts (e.g., `scripts/nginx-ensure-and-health.sh`) for manual recovery.
When automation fails or legacy hosts need attention:

- Dispatch `blackroad-deploy.yml` with `target=legacy-ssh` to use the SSH
  fallback path.
- Refer to environment manifests for Terraform backends and AWS resources before
  running manual CLI operations.
- Document the action in the incident log and append any new requirements to the
  corresponding manifest.

Following this playbook ensures GitHub workflows, manifests, and runbooks stay
coordinated as infrastructure evolves.
