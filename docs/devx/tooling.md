# Developer Tooling Baseline

## Pre-commit automation

- Managed by `lefthook.yml`.
- Runs lint (`npm run lint --if-present` and `make lint`), targeted tests, and `scripts/devx/secret_scan.sh` (Dockerised gitleaks) on each commit.
- Invoking `lefthook install` will wire the Git hooks after cloning.

## PR hygiene

- `commitlint` enforced through `.github/workflows/lint-pr.yml` with the conventional commits preset.
- Preview environments post URLs back to the pull request for manual QA.
- Definition-of-Done checklist ships in the repository template (`docs/devx/repo-template.md`).

## Dev containers

- `.devcontainer` builds from Ubuntu 22.04 with Node 20, AWS CLI, Terraform 1.6, and the SSM Session Manager plugin.
- Installs commitlint globally and Python pre-commit dependencies in the container.
- VS Code recommendations include Terraform, ESLint, Prettier, and Python extensions.

## Makefile contract

- `make build` → Docker build using the repository `Dockerfile`.
- `make test` / `make lint` → Python virtualenv harness plus npm fallbacks via Lefthook.
- `make run` → Brings up the application container using Docker Compose.
- `make deploy` / `make preview-destroy` → Wrapper around Terraform preview stack (requires `PR=<number>` and AWS credentials).

## Ten-minute CI guarantee

`.github/workflows/ci.yml` enforces a ten-minute timeout for the Python and Node build jobs so that excessively long feedback loops fail fast.
