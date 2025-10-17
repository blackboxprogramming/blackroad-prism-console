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

## Current coverage

- `production.yml` — customer-facing blackroad.io footprint.
- `staging.yml` — stage.blackroad.io plus the AWS scaffolding that mirrors prod.
- `preview-env.yml` — ephemeral PR preview infrastructure under dev.blackroad.io.
