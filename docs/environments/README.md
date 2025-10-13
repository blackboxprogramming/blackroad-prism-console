# Environment Manifests

The files under `environments/` document how releases, previews, and operational runbooks map onto each deployment footprint for the BlackRoad Prism Console. Each manifest shares the same structure:

- **name / slug / status** — human-friendly identifiers and lifecycle state for the footprint.
- **description** — high-level intent of the environment.
- **branch** — default branch that promotes into the footprint; `DEPLOYMENT.md` anchors the `main` → production and `staging` → staging mapping.【F:DEPLOYMENT.md†L20-L23】
- **urls** — primary host plus any health endpoints, aliases, or preview patterns tied to DNS records.【F:environments/production.yml†L7-L15】【F:environments/staging.yml†L7-L13】【F:environments/preview.yml†L7-L10】
- **governance** — approvals, contacts, and Slack surfaces that coordinate deployments.【F:environments/production.yml†L12-L20】
- **runbooks** — key operational references for release, rollback, and daily maintenance.【F:environments/production.yml†L21-L24】
- **deployment** — branch policy and GitHub workflows responsible for rolling code into the footprint.【F:environments/production.yml†L25-L30】
- **observability** — dashboards or health paths to keep parity between staging, preview, and production telemetry.【F:environments/production.yml†L31-L33】【F:environments/preview.yml†L25-L27】
- **notes** — context and upcoming work, aligned with the active initiative to wire Fly.io and AWS ECS targets into CI/CD.【F:AGENT_WORKBOARD.md†L5-L9】【F:environments/production.yml†L34-L35】

## Footprint summary

### Production
- Live customer-facing surface at `https://blackroad.io`, with health verification baked into the deployment workflow and a dedicated status hostname.【F:environments/production.yml†L7-L15】【F:.github/workflows/blackroad-deploy.yml†L12-L46】【F:docs/blackroad_ops_execution_plan.md†L44-L50】
- Releases run through the `blackroad-deploy` and `release` workflows, which build images, trigger the API deploy hook, and confirm `/healthz` as part of rollout.【F:environments/production.yml†L25-L30】【F:.github/workflows/blackroad-deploy.yml†L12-L89】【F:.github/workflows/release.yml†L1-L27】
- Operations and rollback steps reference the consolidated runbooks so production stays in lockstep with the observed Kubernetes/Grafana stack.【F:environments/production.yml†L21-L24】【F:DEPLOYMENT.md†L37-L64】

### Staging
- Pre-production validation at `https://staging.blackroad.io`, mirrored by CI smoke tests and backed by the same runbooks for parity.【F:environments/staging.yml†L7-L25】【F:.github/workflows/_backup_132_lucidia-ci.yml†L65-L83】
- Internal DNS should expose the footprint via `dev.blackroadinc.us`, preserving the routing guidance from the operations execution plan.【F:environments/staging.yml†L10-L13】【F:docs/blackroad_ops_execution_plan.md†L44-L50】
- Preview hosts (`pr-###.dev.blackroad.io`) graduate into staging before production promotion, giving reviewers time to validate changes in isolation.【F:environments/staging.yml†L32-L34】【F:docs/preview-environments.md†L36-L49】

### Preview
- Each pull request provisions an ECS Fargate service, load-balancer rule, and Route53 alias at `pr-<number>.dev.blackroad.io`, with automatic teardown on close.【F:environments/preview.yml†L1-L31】【F:docs/preview-environments.md†L36-L58】
- The automation relies on repository variables and secrets for cluster metadata and IAM roles, as documented in both the operator and developer guides.【F:environments/preview.yml†L32-L35】【F:docs/preview-environments.md†L7-L33】【F:docs/devx/preview-environments.md†L1-L33】
- Notifications land in `#eng` alongside PR comments so reviewers see each rollout without leaving GitHub.【F:environments/preview.yml†L15-L21】【F:docs/preview-environments.md†L62-L71】
