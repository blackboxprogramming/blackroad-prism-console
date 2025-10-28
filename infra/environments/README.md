# Environment Manifests

These manifests describe the shape of the BlackRoad deployment targets so that automation and operators can reason about them without reverse-engineering Terraform modules or digging through CI configuration. Each file captures the minimum viable information we need to wire CI/CD workflows and runbooks into the appropriate infrastructure footprint.

## File Layout

- `preview.yaml` – ephemeral environments spun up per pull request or short-lived experiment.
- `staging.yaml` – long-running integration environment that mirrors production controls.
- `production.yaml` – customer-facing deployment with stricter guardrails and observability.

## Schema

Every manifest follows the same top-level keys:

- `environment`: Canonical environment slug used by automation and observability tags.
- `description`: Human readable summary of the environment's purpose.
- `owner`: Team or role accountable for the environment.
- `regions`: Cloud regions (and providers) where the footprint lives.
- `repositories`: Source repos that deliver artifacts into the environment.
- `deployments`: Service blocks that capture runtime, scaling, ingress, and health surfaces.
- `dependencies`: External systems this environment relies on (databases, queues, third-party APIs).
- `release_process`: Summary of how changes are promoted, including approval and rollout patterns.

The files are intentionally YAML so that they can be consumed directly by `ops/` automation or rendered into documentation.

## Usage

- **Automation** – Workflows can parse these manifests to determine which Terraform workspace, Fly.io app, or ECS service to operate on.
- **Runbooks** – Incident responders can quickly identify health endpoints and escalation paths.
- **Planning** – Product and infrastructure leads can verify that staging stays in lockstep with production before enabling new features.

When adding new environments, copy an existing manifest and adjust the metadata. Keep the schema aligned so that tooling can rely on consistent keys.
This directory tracks the canonical environment descriptions for BlackRoad Prism deployments.
The manifests are written in YAML so automation and runbooks can consume the same source
of truth when provisioning infrastructure or wiring CI/CD workflows.

## Files

- `blackroad.yaml` — describes the preview, staging, and production targets for the
  public Prism Console deployment. Each environment lists runtime, region, networking,
  and deployment hooks so workflows can publish builds to the correct destination.

## Usage

The manifests are designed to be referenced by scripts and GitHub Actions. A typical
workflow reads the manifest, injects environment-specific secrets, and runs the
appropriate IaC or deployment command.

To keep manifests authoritative:

1. Update the YAML definitions whenever infrastructure characteristics change.
2. Commit the file alongside any Terraform, Helm, or workflow modifications that rely
   on the new configuration.
3. Use environment identifiers (`preview`, `staging`, `production`) consistently across
   CI pipelines, runbooks, and application configuration.
