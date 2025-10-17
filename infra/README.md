# Lucidia Auto-Box Infrastructure Notes

This folder will store infrastructure-as-code definitions and secrets templates once the prototype evolves past local development. Early intentions:

- Maintain separate environments for local, staging, and production with explicit consent gating.
- Provide feature flags for PQC cipher selection and auto-mode availability.
- Document one-click purge workflows that revoke storage and key material simultaneously.

---

## Environment manifests

Canonical environment definitions live in `infra/environments/blackroad.yaml`. The
manifest enumerates preview, staging, and production footprints with their respective
providers, deployment workflows, and observability hooks. Treat the file as the source
of truth for automation:

- Preview entries are consumed by the Terraform stack in `infra/preview-env/` and the
  corresponding GitHub Actions workflow.
- Staging and production definitions align with Fly.io and AWS ECS deploy jobs,
  including the image tags those pipelines should promote.
- Secrets and observability blocks document which stores and telemetry backends each
  environment expects so runbooks can call out required integrations.

Update the manifest when infrastructure configuration changes and reference it from
new runbooks so release operators know which environment characteristics to verify.
