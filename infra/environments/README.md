# Environment Manifests

This directory captures the canonical deploy targets for Prism Console.
It is the source of truth for automation wiring, CI/CD pipelines, and
runbooks so that staging, preview, and production all share the same
contract.

- `environments.yaml` &mdash; high-level description of each footprint,
  including provider targets, release triggers, and policy gates. The file
  is designed to be machine-readable so GitHub Actions, Terraform, or
  other orchestrators can derive deploy steps without re-encoding
  environment specific knowledge.

## Authoring Guidelines

1. Keep every environment self-contained: metadata, targets, and rollout
   policy should live alongside each other to reduce tribal knowledge.
2. Reference deploy workflows or Terraform states by relative path so the
   manifest remains portable across forks.
3. Record policy gates and rollback hooks so runbooks can link directly to
   authoritative procedures.
4. Treat this directory as the control plane &mdash; infrastructure changes
   should start here and then be implemented in the respective automation
   directories (`infra/preview-env`, `infra/prism`, `.github/workflows/`,
   etc.).

## Next steps

- Connect the manifest to GitHub Actions so deploy jobs can read targets
  and automatically select Fly.io vs. AWS ECS.
- Extend Terraform modules to consume the same metadata, ensuring state
  files stay in sync with release automation.
- Update release runbooks to reference the manifest rather than duplicating
  environment descriptions.
