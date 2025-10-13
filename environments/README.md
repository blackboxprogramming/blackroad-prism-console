# Environment manifests

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
