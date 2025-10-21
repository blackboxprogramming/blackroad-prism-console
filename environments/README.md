# Environment manifests

The files in this directory capture the source-of-truth for each deployed or
planned environment. They summarise domains, deployment workflows, Terraform
roots, health checks, and required approvals so that release and ops teams have
one place to reference when wiring automation.

## Field guide

Every manifest follows a lightweight schema so ops and release automation stay
in sync:

- `name` / `slug` — human and short identifiers.
- `state` — `active`, `provisioning`, or `planned` based on readiness.
- `description` — quick context for why the environment exists.
- `contacts` — default Slack or reviewer routing.
- `domains` — canonical hostnames or URL patterns served by the environment.
- `deployments` — per-service blocks describing workflow triggers, hosting
  providers, Terraform roots (when applicable), and health checks. Use
  `state` inside each block when a service is still being wired up.
  - When Terraform manages the deployment, include `terraform_backend`
    metadata so operators know where remote state and locks live.
- `infrastructure` — cloud region, Terraform roots, and backend state files that
  provision the footprint.
- `automation` — deploy workflows, required secrets, and notification routes
  that move new builds into the environment.
- `change_management` — approvals or runbooks that must be followed.
- `observability` — scripts or commands teams use to verify the environment.

The additional `infrastructure` and `automation` sections make it easier for
release tooling to wire GitHub Actions, Terraform state, and downstream
dashboards together without trawling the monorepo. Update both sections whenever
we add a new workflow, change Terraform backends, or swap regions so bots and
humans stay aligned.

Update the manifest whenever the environment changes (new workflow, Terraform
module, domain, or approval requirement). These files should stay aligned with
`br-infra-iac`, `.github/workflows/*`, and the documented runbooks.

## Validating changes

Run the schema validator to confirm manifests stay consistent:

```bash
./scripts/validate_environment_manifests.py
```

The command exits non-zero when a manifest fails validation and prints the
specific path and schema error to help with debugging.
## CLI helper

Generate a quick summary for release tooling (or manual spot checks) with the
environment summary script:

```bash
python tools/environments_summary.py --format text
```

Filter to a single environment by slug when wiring automation:

```bash
python tools/environments_summary.py --env stg
```

## Current coverage

- `production.yml` — customer-facing blackroad.io footprint.
- `staging.yml` — stage.blackroad.io plus the AWS scaffolding that mirrors prod.
- `preview.yml` — ephemeral PR preview infrastructure under dev.blackroad.io.
Each file in this directory captures the reviewers and routing details for one deployment footprint. Automation can load these YML documents to determine who to ping for approvals and which hostnames map to the environment.

## Fields

- `name`: Short identifier for the environment.
- `url`: Canonical hostname that represents the environment (used for status pings and dashboards).
- `url_template` (optional): Template for ephemeral endpoints, used by preview environments that spin up per PR (`<number>` is replaced with the pull request number).
- `reviewers`: Default GitHub handles or teams who should review releases hitting the environment.
- `notes`: Free-form context about infrastructure targets or routing.

## Current environments

- `production.yml` — Public site at https://blackroad.io
- `staging.yml` — Release-candidate staging stack on Fly.io + AWS ECS
- `preview.yml` — Ephemeral per-PR preview routed through AWS ALB and Route53 under `*.dev.blackroad.io`

Extend these files with additional metadata (e.g., deploy workflows, health checks) as automation matures.
