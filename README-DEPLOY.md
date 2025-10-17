# BlackRoad deployment workflows

This repository exposes two deployment paths that now live inside a single
GitHub Actions workflow (`.github/workflows/blackroad-deploy.yml`). The default
"modern" path is triggered automatically on pushes to `main` and talks to the
BlackRoad deploy webhook. A manual "legacy" path remains available for the
historic SSH-based rollout and can be triggered on demand from the Actions tab.

## Modern webhook deploy (default)

Pushes to `main` execute the **Modern webhook deploy** job. The workflow builds
in place, calls `POST /api/deploy/hook`, and performs progressive verification
with cache purges and Slack notifications when configured.

### Required configuration

Add the following Action secrets/variables under
**Settings → Secrets and variables → Actions**:

- `BR_DEPLOY_SECRET` — bearer token accepted by `/api/deploy/hook` and
  `/api/deploy/trigger`.
- `BR_DEPLOY_URL` — optional override if the webhook lives somewhere other than
  `https://blackroad.io/api/deploy/hook`.
- `CF_ZONE_ID` / `CF_API_TOKEN` — optional Cloudflare purge credentials used
  when the version check fails.
- `SLACK_WEBHOOK_URL` — optional Slack notification target.
- `SITE_URL` / `API_URL` (Repository **variables**) — optional overrides when the
  canonical domains differ from `https://blackroad.io`.

### What the job does

1. Installs dependencies and builds the Prism console.
2. Calls the deploy webhook with the current SHA, branch, and actor.
3. Waits for the API to report the new build SHA, purging Cloudflare or forcing a
   rebuild if necessary.
4. Revalidates `/healthz` and `/api/version` before marking the run successful.
5. Posts a Slack summary when `SLACK_WEBHOOK_URL` is available.

## API ECS deployments

Use `.github/workflows/blackroad-api-ecs.yml` when you need to roll out the API
service onto AWS ECS. The workflow wraps the reusable
`reusable-ecs-service-deploy.yml` helper so other pipelines can call it with
`workflow_call`, while the manual dispatch path provides an operator-friendly
form in the Actions UI.

### Required secrets and variables

Configure the following repository secrets for each environment:

- `STAGING_AWS_DEPLOY_ROLE_ARN` / `PROD_AWS_DEPLOY_ROLE_ARN` — IAM roles that
  grant the workflow permission to register task definitions and update the
  service.
- `STAGING_ECS_CLUSTER` / `PROD_ECS_CLUSTER` — ECS cluster names or ARNs.
- `STAGING_ECS_SERVICE` / `PROD_ECS_SERVICE` — Service identifiers to update.
- `STAGING_ECS_CONTAINER` / `PROD_ECS_CONTAINER` — Container names within the
  task definition whose image should be replaced.

If another workflow invokes `blackroad-api-ecs.yml` with its own
`workflow_call` block, it can pass alternative credentials or ECS identifiers by
providing the optional secrets `AWS_ROLE_TO_ASSUME`, `ECS_CLUSTER`,
`ECS_SERVICE`, and `ECS_CONTAINER`.

### Dispatch inputs

- `environment` — `staging` or `production` to select the secret set.
- `image` — Optional image reference. Defaults to
  `ghcr.io/blackboxprogramming/blackroad-api:<sha>` when left blank.
- `wait-for-service-stability` — Defaults to `true`. Set to `false` to skip the
  `aws ecs wait services-stable` step when running parallel smoke tests.

## Legacy SSH fallback

The historical SSH pipeline still exists as a manual job. Trigger it from the
workflow's **Run workflow** dialog and choose `legacy-ssh` for the `target`
input. Optional inputs let you deploy another ref or override the health check
endpoints used during verification.

### Legacy-specific secrets and variables

Configure these secrets if you rely on the fallback path:

- `DEPLOY_HOST` — target server hostname.
- `DEPLOY_USER` — SSH user that can write to `/var/www/blackroad` and
  `/srv/blackroad-api`.
- `DEPLOY_KEY` — private SSH key with access to the host.
- `DEPLOY_PORT` — optional port (set as a secret or variable) if SSH does not
  run on 22.

### Workflow behaviour

1. Checks out the requested ref (defaults to the workflow ref).
2. Builds `sites/blackroad` and packages the API into tarballs.
3. Uploads both archives to the host via SCP.
4. Extracts the artifacts, restarts `blackroad-api` and `lucidia-llm`, and checks
   the supplied health endpoints before finishing.

### Health overrides

The manual dispatch form accepts `health_url` and `api_health_url` inputs. When
left blank, the workflow checks `https://blackroad.io/health` and
`https://blackroad.io/api/health` respectively. Provide alternate URLs if you
are targeting a different host.

## Related documentation

- [`DEPLOYMENT.md`](DEPLOYMENT.md) — GitHub App setup, branch policy, and
  rollback tooling.
- [`environments/production.yml`](environments/production.yml) — source-of-truth
  manifest for production infrastructure and automation.
