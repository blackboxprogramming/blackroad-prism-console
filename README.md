# BlackRoad Prism Console

This repository powers the BlackRoad Prism console and a Vite/React site under `sites/blackroad`.

## Quickstart

Install dependencies:

```bash
npm ci
(cd sites/blackroad && npm i --package-lock-only)
```

## Development

```bash
cd sites/blackroad
npm run dev
```

## Build

```bash
cd sites/blackroad
npm run build
```

## Tests

```bash
npm test
```

Additional operational docs live in the [`docs/`](docs) folder.

## Ops Integrations

- **Slack**: add `SLACK_WEBHOOK_URL` secret → use `/slack message…` on any PR/Issue.
- **PagerDuty**: add `PD_ROUTING_KEY` → run the **PagerDuty Incident (manual)** workflow to trigger.
- **Uptime**: pings every 10m; opens/updates “🚨 Uptime … DOWN” issue on failure.
- **SBOM**: CycloneDX JSON artifact pushes on `main`.
- **Trivy**: scheduled file-system vulnerability scan.
- **Policy-as-code**: OPA checks for risky workflow/infra changes (see `policy/ci.rego`).
- **Devcontainer**: `Open in Dev Container` to get a ready-to-code Node 20 + Python toolchain.
- **Pre-commit**: optional local hooks (`pre-commit install`).
