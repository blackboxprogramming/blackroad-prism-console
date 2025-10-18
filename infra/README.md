# Lucidia Auto-Box Infrastructure Notes

This folder will store infrastructure-as-code definitions and secrets templates once the prototype evolves past local development. Early intentions:

- Maintain separate environments for local, staging, and production with explicit consent gating.
- Provide feature flags for PQC cipher selection and auto-mode availability.
- Document one-click purge workflows that revoke storage and key material simultaneously.

## Environment manifests

Environment descriptors live under [`infra/environments`](./environments). They summarise the runtime footprint for each target (`preview`, `staging`, and `production`) so automation and responders have a single source of truth.

Each manifest captures ownership, regions, deployments, dependencies, and rollout policy. Tooling in `ops/` and CI workflows can ingest these YAML files to select the right Terraform workspace, Fly.io app, or ECS service before applying changes. When adding new infrastructure, update the corresponding manifest so release runbooks, dashboards, and pipelines stay aligned.
