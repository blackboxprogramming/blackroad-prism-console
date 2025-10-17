# Environment Manifests

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
