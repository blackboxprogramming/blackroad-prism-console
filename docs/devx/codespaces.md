# GitHub Codespaces Setup

The repository ships a ready-to-use [Dev Container](https://containers.dev) definition so that GitHub Codespaces instances
match the expectations of the on-call and local developer environments.

## Container image

- Builds from Ubuntu 22.04 and installs build tooling required for native Node.js modules (`better-sqlite3`).
- Ships Python 3, Go 1.22, Terraform 1.6, the AWS CLI, and the SSM session manager plugin.
- Installs `awscli-local` for parity with local workflows.

## Bootstrap steps

When a codespace is created, `.devcontainer/scripts/postCreate.sh` runs automatically and:

1. Enables Corepack and exposes `pnpm` in case you prefer it over npm.
2. Installs global `@commitlint/cli` tooling as well as Python `pre-commit` hooks.
3. Syncs the Python developer dependencies from `requirements-dev.txt`.
4. Runs `npm ci` (skipping audit/fund prompts) and `pnpm install --frozen-lockfile`
   (if available) so the workspace has all JS packages ready to go.
5. Marks the repository as a safe Git directory inside the container.

Port forwarding for the main services is pre-configured:

- **3000** — Next.js front-end development server.
- **4000** — Express API.
- **8000** — Local LLM stub used during demos.

## Recommended first steps

```bash
# verify dependencies
npm run lint
npm test

# initialise git hooks
pre-commit install
```

Refer to [`README.md`](../../README.md) for the broader project overview and to [`docs/devx/tooling.md`](./tooling.md) for the full developer tooling baseline.
