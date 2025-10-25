# Platform Setup Guide

This document describes how to provision credentials and infrastructure for the
Codex agent deployment pipeline. Use it as the source of truth when refreshing
secrets, onboarding new operators, or verifying that the integration matrix is
healthy after a redeploy.

## 1. Prerequisites

- Access to the shared secret manager (Keycloak realm **codex-ops** or the
  Supabase project configured for automation).
- Membership in the relevant platform organizations (GitHub, Slack, Notion,
  Linear, Dropbox, HubSpot, Hugging Face).
- Docker and Docker Compose installed locally, or access to the automation
  runner on DigitalOcean.

## 2. Credential Issuance Checklist

For each platform use the following baseline:

| Platform      | Credential Type                         | Notes |
| ------------- | --------------------------------------- | ----- |
| GitHub        | Personal Access Token (Fine-grained)    | Enable `Contents`, `Issues`, and `Actions` scopes. Rotate every 90 days. |
| Hugging Face  | User Access Token                       | Grant `read` + `write` scopes for models and spaces. |
| Slack         | Bot Token (`xoxb-…`)                    | Install the "Codex Ops" app in the workspace and enable `chat:write` + `channels:read`. |
| Notion        | Internal Integration Token              | Share required databases and spaces with the integration. |
| Linear        | API Key                                 | Assign to the `Automation` team with `write` permissions on issues. |
| Dropbox       | OAuth 2 Refresh Token                   | Limit to the `/Codex` folder; enable automatic refresh via Keycloak. |
| HubSpot       | Private App Token                       | Scope for `crm.objects.contacts.read`/`write` and `tickets.read`. |

Store tokens in Keycloak secrets or encrypt them with `sops-age` before
committing to configuration repositories.

## 3. Environment Bootstrapping

```bash
bash setup_env.sh
export GITHUB_TOKEN=<token>
export HF_TOKEN=<token>
export SLACK_BOT_TOKEN=<token>
export NOTION_TOKEN=<token>
export LINEAR_API_KEY=<token>
export DROPBOX_KEY=<token>
export HUBSPOT_TOKEN=<token>
docker compose up -d
python scripts/onboard_agents.py
```

- The script writes deployment logs to `logs/deployment.log` and an aggregated
  registry to `registry/platform_connections.json`.
- When running inside CI, inject credentials as environment variables and allow
  the script to consume them dynamically.

## 4. Verification Procedure

1. Run the ping checks:
   - `GET /api/github/ping`
   - `GET /api/slack/ping`
   - `GET /api/huggingface/ping`
2. Review the onboarding dashboard (`ui/pages/onboarding.tsx`) for current
   status and any agents pending action.
3. Confirm that a Slack summary arrives in `#codex-ops` with the deployment
   counts.

## 5. Monitoring Expectations

- Heartbeat interval: **10 minutes**
- Alert routing: `#dev-ops` Slack channel + Grafana Alertmanager
- Track metrics for token refresh failures, failed logins, and API latency.

## 6. Role Downgrade Rule

If an agent has not logged activity in >90 days downgrade the role to
`observer` and remove write scopes from the associated tokens.
