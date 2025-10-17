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
