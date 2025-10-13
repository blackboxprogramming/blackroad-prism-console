# 🚀 Ritual Merge Automation

This repository now supports "reaction-driven" merges. React to any pull request comment
with a 🚀 emoji and the automation stack will:

1. Validate that the reactor has `write` (or higher) permission.
2. Confirm the PR is open, approved, clean, and up to date with required checks.
3. Re-run the unit tests and build against the PR head.
4. Merge the PR with a squash commit, apply a conventional release bump, and push tags.
5. Assemble a deployable tarball, publish a GitHub release, and (optionally) deploy.
6. Respond on the PR thread with a success or failure receipt.

## Components

| File | Purpose |
| --- | --- |
| `scripts/ritual-merge/webhook-server.js` | Express server that listens for webhook deliveries and dispatches the workflow. |
| `.github/workflows/ritual-merge.yml` | Guarded workflow that re-validates the PR, merges, releases, and deploys. |

### Webhook receiver

The webhook accepts `reaction` events and dispatches the workflow when the reaction is
`rocket`. Configure the repo webhook with the shared secret in `GH_WEBHOOK_SECRET` and
ensure the server has a `GH_TOKEN` with `repo:status`, `contents:write`, and
`pull_requests` scopes.

### Workflow overview

- The workflow validates the PR state, approvals, and status checks using `gh` + `jq`.
- Tests and builds run on the PR head (`npm ci`, `npm test -- --ci`, `npm run build`).
- After merging, the workflow checks out the base branch, runs `standard-version`, and
  pushes the generated tag and changelog updates.
- A release tarball is built from the production web and API assets, attached to a
  GitHub release, and optionally deployed via `scripts/deploy.sh` when deployment
  secrets are present.
- Success or failure is written back to the PR via `gh pr comment`.

### Deployment toggles

Deployment is skipped automatically unless the following secrets are configured in the
repository or environment:

- `SERVER_HOST`
- `SERVER_USER`
- `SSH_KEY` (or `SSH_KEY_PATH`)

When set, the workflow reuses the existing `scripts/deploy.sh` implementation to push the
release to the production hosts.

### Extending the ritual

- Add additional emoji bindings (e.g., 🔁 to re-run tests only) by branching the webhook
  handler.
- Enrich the receipt comment with artifact URLs, RoadCoin / Portal deploy steps, or other
  environment-specific details.
- Wire the webhook server into Cloud Run, Fly.io, or another managed container host for
  always-on availability.
