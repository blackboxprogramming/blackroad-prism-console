# Environment manifests

The files in this directory describe where and how each BlackRoad Prism Console environment is deployed.
They provide a single place for release engineering, infrastructure, and operations teams to agree on the
shape of staging, preview, and production footprints noted in `../AGENT_WORKBOARD.md`.

## Schema

Each manifest is a YAML document with the following top-level keys:

| Key | Description |
| --- | --- |
| `name` | Human readable name of the environment. |
| `slug` | Short identifier used in automation (e.g., `prod`, `stg`). |
| `status` | Lifecycle flag: `active`, `planned`, or `deprecated`. |
| `description` | One or two sentence summary of the environment's purpose. |
| `domains` | Map of externally visible domains for this environment. |
| `deploy_targets` | Array of deployment targets. Each entry includes a `provider`, optional configuration fields (`app`, `config`, `region`, etc.), a `status`, and free-form `notes`. |
| `ci_cd` | Workflows, branches, and promotion details used to reach the environment. |
| `approvals` | Change control requirements, reviewer handles, and policy gates. |
| `runbooks` | Links to the runbooks that cover routine deploy/rollback procedures. |
| `observability` | Dashboards, alerting integrations, and logging references. |
| `notes` | Extra bullet points that do not fit cleanly elsewhere. |

### Usage

- New infrastructure work should add or update a manifest entry instead of sprinkling environment-specific
  details through docs.
- CI/CD and automation bots can consume these manifests to decide where to promote builds and which guardrails
  to enforce before touching an environment.
- When an environment graduates from `planned` to `active`, update the manifest and notify the deploy bots so
  they can wire the new target into their pipelines.

These manifests intentionally stay concise so they remain easy to keep in sync with actual infrastructure.
