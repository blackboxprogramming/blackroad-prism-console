# Secrets & Environment Variable Reference

This guide documents every environment variable and GitHub Actions secret used by
BlackRoad Prism Console. It pairs with the automation in
`scripts/setup-secrets.sh` and `scripts/validate-env.sh` so that you can audit,
bootstrap, and continuously verify configuration across local development and
CI/CD.

## Getting Started

1. Review `.env.example` for the full catalogue of variables grouped by domain.
2. Run `scripts/setup-secrets.sh` to create or update a local `.env`. The
   script detects existing values, prompts for anything missing, validates common
   formats (ports, booleans, integers), and records which fields still need
   attention.
3. Committers can run `scripts/validate-env.sh` (also wired for CI) to check
   whether the current shell environment and `.env` file satisfy all required
   variables. Exit codes: `0` (complete), `1` (missing required vars), `2`
   (optional vars missing).
4. Store production secrets in your vault (1Password, AWS Secrets Manager, etc.)
   and mirror them into GitHub repository secrets for automation workflows.

When generating secrets locally, prefer deterministic commands so onboarding is
repeatable. For example, use `openssl rand -hex 32` for random tokens and
`python - <<'PY'` scripts for structured JSON.

## Core Runtime Variables

| Name | Required | Purpose | Development guidance | Production notes |
| --- | --- | --- | --- | --- |
| `PORT` | Yes | HTTP port for the primary BlackRoad API server. | Use `4000` to mirror the documented default. | Ensure port is open in load balancer / firewall rules. |
| `SESSION_SECRET` | Yes | Secret key for encrypting cookie-session payloads. | Generate via `openssl rand -hex 32`. Do **not** commit. | Rotate when staff changes. Update CI `SESSION_SECRET` secret as well. |
| `INTERNAL_TOKEN` | Yes | Shared bearer token for inter-service and agent authentication. | Generate a random 32+ character string; reuse for local services. | Store centrally (e.g., vault) and rotate on incident response. |
| `ALLOW_ORIGINS` | Yes | Comma separated list of allowed CORS origins. | Include `http://localhost:3000` for frontend dev. | Mirror production domains (e.g., `https://console.blackroad.io`). |

## API Service Variables

| Name | Required | Purpose | Development guidance | Production notes |
| --- | --- | --- | --- | --- |
| `DB_PATH` | Optional | SQLite database location for the API. | Default `/srv/blackroad-api/blackroad.db`; override per-user under `./data`. | Point to durable storage (EBS, NFS, or Postgres via connector). |
| `LLM_URL` | Yes | URL for the Lucidia LLM chat endpoint. | Use `http://127.0.0.1:8000/chat` with the bundled FastAPI app. | Point to the managed LLM endpoint or inference gateway. |
| `MATH_ENGINE_URL` | Optional | URL for the math/analytics microservice. | Leave blank unless running `lucidia-math` locally. | Configure to the analytics cluster endpoint. |
| `ALLOW_SHELL` | Optional | Enables server-side shell commands when `true`. | Keep `false` unless testing automation features. | Only enable behind strict RBAC and auditing. |
| `WEB_ROOT` | Optional | Filesystem path for static assets served by the API. | Defaults to `/var/www/blackroad`; override to `./frontend/out` in dev. | Mount to CDN origin directory in production. |
| `BILLING_DISABLE` | Optional | Forces billing features off even if Stripe keys exist. | Useful when developing without Stripe credentials. | Leave `false` in production; rely on Stripe readiness instead. |
| `DEBUG_MODE` / `DEBUG_PROBES` | Optional | Enables debug probes and verbose logging. | Toggle to troubleshoot locally. | Leave disabled; debug probes increase log volume. |
| `BYPASS_LOGIN` | Optional | Allows bypassing login prompts for local testing. | Set to `true` only in dev sandboxes. | Must remain `false` in production. |
| `FLAGS_PARAM` | Optional | Feature-flag configuration key/path. | Default `/blackroad/dev/flags`. | Point to production flag namespace. |
| `FLAGS_MAX_AGE_MS` | Optional | Cache TTL for feature flags. | Use `30000` (30s) by default. | Tune per production load; monitor flag staleness. |
| `GITHUB_WEBHOOK_SECRET` | Optional | Secret for validating GitHub webhook payloads. | Generate random string if running webhook listener locally. | Copy from GitHub webhook configuration. |
| `BRANCH_MAIN` / `BRANCH_STAGING` | Optional | Branch names for deployment flows. | Defaults to `main` / `staging`. | Align with release branching strategy. |
| `AIRTABLE_API_KEY` | Optional | Airtable integration key. | Add only if exercising Airtable modules. | Store in secure vault; limit scopes. |
| `DISCORD_INVITE` | Optional | Invite URL for Discord workflows. | Provide test server invite when experimenting. | Use dedicated production invites to avoid leak. |
| `GOOGLE_CALENDAR_CREDENTIALS` | Optional | Service account JSON for Google Calendar sync. | Export JSON, base64 encode for `.env`. | Use dedicated service account with least privilege. |
| `GSHEETS_SA_JSON` | Optional | Service account JSON for Google Sheets sync. | Same handling as calendar credentials. | Store separately from runtime container image. |
| `GUMROAD_TOKEN` | Optional | Gumroad API token for commerce. | Only required when testing Gumroad connectors. | Use production merchant token in production. |
| `ICS_URL` | Optional | External ICS feed for calendar ingestion. | Provide team ICS feed to validate scheduling features. | Keep ICS feeds restricted if private calendars. |
| `LINEAR_API_KEY` | Optional | Linear API key for dashboards. | Generate personal API key for dev; limit scope. | Use shared workspace key for production reporting. |
| `MAIL_PROVIDER` | Optional | Identifier for transactional mail provider (e.g., `sendgrid`). | Keep blank unless outbound email is configured. | Ensure provider credentials exist alongside this setting. |
| `PRICE_*_CENTS` | Optional | Plan pricing (monthly/annual) in cents. | Populate with test values when exercising pricing UI. | Mirror pricing managed by finance for billing accuracy. |
| `SF_USERNAME` | Optional | Salesforce integration username. | Use sandbox user when testing. | Point at production integration user; enforce MFA via connected app. |
| `SHEETS_CONNECTOR_TOKEN` | Optional | Token for Sheets bridge. | Provided by connector bootstrap scripts. | Rotate regularly; map to service account. |
| `SLACK_WEBHOOK_URL` | Optional | Slack webhook for operational alerts. | Create Slack app with incoming webhook for dev channel. | Use dedicated production channel and restrict membership. |
| `STRIPE_SECRET` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PUBLIC_KEY` | Optional | Stripe billing credentials. | Use Stripe test keys in dev. | Load production keys from Stripe dashboard; pair with webhook signing secret. |
| `SUBSCRIBE_MODE` | Optional | Overrides billing provider (`stripe`, `gumroad`, `sandbox`). | Use `sandbox` during integration testing. | Match production provider (`stripe`). |

## Lucidia LLM Variables

| Name | Required | Purpose | Notes |
| --- | --- | --- | --- |
| `LUCIDIA_MODEL` | Optional | HuggingFace model name to load. | Defaults to `meta-llama/Meta-Llama-3-8B-Instruct`; adjust for experiments. |
| `LUCIDIA_USE_MODEL` | Optional | Enables real model loading when set to `1`. | Leave unset (`0`) to run the lightweight echo stub. |

## Unity Exporter Variables

| Name | Required | Purpose | Notes |
| --- | --- | --- | --- |
| `PORT` | Optional | Port for the Unity exporter server when started standalone. | Defaults to `3000`; ensure it does not clash with the API port. |
| `UNITY_EXPORTER_OUTPUT_DIR` | Optional | Directory for generated Unity archives. | Override when storing exports outside the repo tree. |

## Agent Runtime Variables

| Name | Required | Purpose | Notes |
| --- | --- | --- | --- |
| `AGENTS_INTERNAL_TOKEN` | Optional | Override token for agent runtime control-plane. | Falls back to `INTERNAL_TOKEN`; set only if agents need a separate credential boundary. |

## CI/CD Secrets (GitHub Actions)

All CI/CD secrets are optional for local development and **must** be defined as
repository or environment secrets in GitHub for workflows to run end-to-end.
Group secrets logically to simplify rotation and approvals.

### Deployment & Infrastructure

| Secret | Required | Purpose & provisioning |
| --- | --- | --- |
| `AWS_ROLE_TO_ASSUME` | Optional | ARN of the IAM role assumed by workflows via GitHub OIDC. Create role with least privilege for deployments. |
| `BR_DEPLOY_SECRET` | Optional | Token used by BlackRoad deployment scripts to authenticate with internal APIs. Provision via deployment platform. |
| `BR_DEPLOY_URL` | Optional | Endpoint for BlackRoad deployment orchestrator. Store the base URL provided by infra team. |
| `BR_HOST` / `BR_USER` / `BR_SSH_KEY` | Optional | SSH target and credentials for legacy BlackRoad hosts. Generate per-host SSH keys and add to authorized keys. |
| `BRANCH_CLEANUP_TOKEN` | Optional | Token that allows branch cleanup automation to delete merged branches. Create scoped GitHub PAT. |
| `BACKUP_PASSPHRASE` | Optional | Passphrase for encrypting backup archives. Generate and share only with backup operators. |
| `BILLING_EXPORT_URL` | Optional | Destination webhook/endpoint for billing export artifacts. Point to finance data lake ingestion. |
| `CF_API_TOKEN` / `CF_ZONE_ID` | Optional | Cloudflare API token and zone ID for DNS/CDN automation. Generate scoped token via Cloudflare dashboard. |
| `GODADDY_API_KEY` / `GODADDY_API_SECRET` | Optional | GoDaddy credentials for DNS automation. Create API key/secret in the GoDaddy developer portal. |
| `DATABASE_URL` | Optional | Connection string for database migrations or reporting jobs. Use separate writer/readers per environment. |
| `DEPLOY_HOST` / `DEPLOY_USER` / `DEPLOY_KEY` / `DEPLOY_PORT` | Optional | Generic SSH deployment target and credentials. Manage via infrastructure runbooks. |
| `DOCKER_PAT` / `DOCKER_USER` | Optional | Docker registry credentials for pushing preview images. Generate Docker Hub token or internal registry PAT. |
| `DROPLET_HOST` / `DROPLET_IP` / `DROPLET_USER` / `DROPLET_SSH_KEY` | Optional | Legacy DigitalOcean droplet deployment information. Rotate SSH keys regularly. |
| `KUBE_CONFIG_B64` | Optional | Base64 encoded kubeconfig for Kubernetes clusters. Export `~/.kube/config` and base64 encode. |
| `ORCHESTRATOR_TOKEN` | Optional | Token for orchestrator workflows (e.g., meta pipelines). Obtain from automation platform. |
| `PREVIEW_ENV_AWS_ROLE` / `PREVIEW_ENV_CLUSTER_ARN` / `PREVIEW_ENV_ECR_REGISTRY` / `PREVIEW_ENV_ECR_REPOSITORY` / `PREVIEW_ENV_EXECUTION_ROLE_ARN` / `PREVIEW_ENV_HOSTED_ZONE_ID` / `PREVIEW_ENV_PRIVATE_SUBNET_IDS` / `PREVIEW_ENV_PUBLIC_SUBNET_IDS` / `PREVIEW_ENV_SECRETS_JSON` / `PREVIEW_ENV_TASK_ROLE_ARN` / `PREVIEW_ENV_TF_LOCK_TABLE` / `PREVIEW_ENV_TF_STATE_BUCKET` / `PREVIEW_ENV_VARS_JSON` / `PREVIEW_ENV_VPC_ID` | Optional | AWS parameters for preview environments. Copy values from Terraform outputs or AWS Console exports and store JSON payloads as strings. |
| `PROM_URL` | Optional | Prometheus endpoint for observability jobs. Use authenticated URL when scraping private metrics. |
| `REDIS_URL` | Optional | Redis connection string for cache-related workflows. Provide `rediss://` for TLS clusters. |
| `REGISTRY_TOKEN` / `REGISTRY_USER` | Optional | Alternative container registry credentials. Provision per registry (GHCR, ECR, etc.). |
| `SSH_PRIVATE_KEY` | Optional | Generic SSH private key for automation runners. Store as multi-line secret. |
| `STAGING_URL` | Optional | Base URL for staging smoke tests. Update when staging hostname changes. |
| `WAREHOUSE_URL` / `WAREHOUSE_TOKEN` | Optional | Analytics warehouse endpoint and API token. Provision via data platform (Snowflake, BigQuery, etc.). |
| `PG_URL_DEV` | Optional | Development Postgres connection string for ETL tasks. Use sandbox database. |

### Notifications & ChatOps

| Secret | Required | Purpose & provisioning |
| --- | --- | --- |
| `ASANA_WEBHOOK_URL` | Optional | Incoming webhook for Asana automation. Configure via Asana developer console. |
| `BOT_TOKEN` / `BOT_USER` | Optional | Credentials for bespoke automation bots. Issue via Slack/Discord bot configuration. |
| `CLICKUP_WEBHOOK_URL` | Optional | Webhook endpoint for ClickUp notifications. Configure in ClickUp workspace. |
| `DISCORD_WEBHOOK_URL` | Optional | Discord webhook used for alerts. Create via Discord channel integrations. |
| `PARTNER_REVIEW_SLACK_WEBHOOK` | Optional | Slack webhook for partner review updates. Create dedicated Slack app & channel. |
| `PD_ROUTING_KEY_SMOKE` | Optional | PagerDuty routing key for smoke-test alerts. Generate via PagerDuty service integration. |
| `SLACK_BOT_TOKEN` | Optional | OAuth token for Slack bot actions. Issue via Slack app with minimum scopes. |
| `SLACK_PREVIEW_CHANNEL` | Optional | Slack channel ID receiving preview deployment notices. Capture from Slack channel info. |
| `SLACK_WEBHOOK` / `SLACK_WEBHOOK_EXEC` / `SLACK_WEBHOOK_SMOKE` / `SLACK_WEBHOOK_URL` | Optional | Slack incoming webhooks for different audiences. Create separate webhooks per channel to isolate notifications. |
| `TELEMETRY_TOKEN` | Optional | Token for telemetry collectors posting status updates. Generate via telemetry service console. |
| `WEBHOOK_SIGNING_SECRET` | Optional | Shared secret to verify inbound webhook payloads (Slack, Stripe, etc.). Mirror the value configured on the provider. |
| `CHANGE_APPROVAL_SECRET` | Optional | Shared secret used by approval workflows before performing sensitive actions. Rotate in lockstep with change-management policy. |

### Identity, Productivity, and CRM Integrations

| Secret | Required | Purpose & provisioning |
| --- | --- | --- |
| `GITHUB_PAT` / `GITHUB_TOKEN` | Optional | GitHub API tokens for automation beyond the default token. Create PAT with required scopes. |
| `HUBSPOT_TOKEN` | Optional | HubSpot API token for CRM sync. Provision via HubSpot private app. |
| `JIRA_BASE` / `JIRA_TOKEN` / `JIRA_USER` / `JIRA_PROJECT` | Optional | Jira connection info for automation. Create API token under Atlassian account; use base URL of instance. |
| `LINEAR_TOKEN` / `LINEAR_TEAM` | Optional | Linear API access for roadmap syncing. Generate personal token or service account token. |
| `NOTION_TOKEN` | Optional | Notion integration token for workspace automations. Share relevant pages with the integration. |
| `OKTA_URL` / `OKTA_TOKEN` / `OKTA_CLIENT_SECRET` | Optional | Okta administration and OAuth credentials. Retrieve from Okta admin console (API token + OAuth app). |
| `OP_SA_TOKEN` | Optional | 1Password service account token used to fetch secrets. Create service account with read-only permissions. |
| `PUBLIC_API_KEY` | Optional | Public API key distributed to partner services. Mint via console or secrets manager. |
| `SALESFORCE_URL` / `SALESFORCE_TOKEN` | Optional | Salesforce instance URL and API token (via connected app). |

### Security & Compliance

| Secret | Required | Purpose & provisioning |
| --- | --- | --- |
| `GITGUARDIAN_API_KEY` | Optional | GitGuardian API key for secret scanning. Create under GitGuardian workspace. |
| `SNYK_TOKEN` | Optional | Snyk API token for vulnerability scans. Generate per Snyk org. |
| `SOPS_AGE_KEY_FILE` | Optional | Age private key used for decrypting SOPS-encrypted files. Export from `age-keygen`; store as multi-line secret. |

### Product Distribution & Platform Services

| Secret | Required | Purpose & provisioning |
| --- | --- | --- |
| `APPLE_TEAM_ID` | Optional | Apple Developer Team ID for iOS builds. Obtain from Apple Developer account. |
| `ASC_ISSUER_ID` / `ASC_KEY_ID` / `ASC_KEY_CONTENT` | Optional | App Store Connect API credentials. Generate API key; store key content (base64) and metadata. |
| `AUTOPAL_BREAK_GLASS_SECRET` | Optional | Emergency override for Autopal automation. Keep offline until needed. |
| `AWAKEN_SEED` | Optional | Seed/token for Awaken integration. Manage via Awaken admin tooling. |
| `HF_TOKEN` | Optional | Hugging Face token for downloading private models. Create via HF account settings. |
| `MATOMO_ENDPOINT` | Optional | Matomo analytics endpoint used by marketing reports. Provide base URL with credentials stored separately. |
| `NPM_TOKEN` / `PYPI_TOKEN` | Optional | Package registry tokens for publishing SDKs. Generate per registry with publish scope. |
| `TWILIO_SID` / `TWILIO_TOKEN` / `TWILIO_FROM` | Optional | Twilio account SID, auth token, and sending number for SMS/voice alerts. Purchase dedicated number for production. |
| `SMTP_URL` | Optional | SMTP connection string for transactional email. Provide credentials inline (`smtp://user:pass@host:port`). |
| `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` / `VERCEL_TOKEN` | Optional | Vercel deployment credentials. Copy from Vercel project settings. |
| `WEBPUSH_PUBLIC_KEY` / `WEBPUSH_PRIVATE_KEY` | Optional | VAPID keys for browser push notifications. Generate via `web-push` CLI. |

### Finance & Treasury

| Secret | Required | Purpose & provisioning |
| --- | --- | --- |
| `COINBASE_BITCOIN` | Optional | Coinbase credential for bitcoin treasury reconciliation. Store API key/secret pair as JSON or encoded string. |
| `GEMINI_SOLANA` | Optional | Gemini credential for Solana holdings. Secure key and secret. |
| `ROBINHOOD_ETHEREUM` | Optional | Robinhood access token for Ethereum positions. Provision via brokerage API. |
| `VENMO_LITECOIN` | Optional | Venmo credential used for litecoin treasury ledger. |
| `FINANCE_CSV_URL` | Optional | URL hosting finance CSV exports. Ensure behind HTTPS with auth. |
| `FINOPS_BUDGET_JSON` | Optional | Budget configuration JSON for FinOps workflows. Store as JSON string. |
| `STRIPE_SECRET_KEY` / `STRIPE_TEST_KEY` | Optional | Stripe keys used for finance exports and tests. Generate from Stripe dashboard (live/test). |
| `BILLING_EXPORT_URL` | Optional | Endpoint receiving billing ledgers. Align with finance ingestion pipeline. |
| `SESSION_SECRET` (CI) | Optional | Session secret reused in CI smoke tests—mirror `SESSION_SECRET` but scoped to Actions secrets. |

> **Tip:** Keep a rotation schedule. Pair every secret with an owner, source of
> truth, and expiry window. The `.env.example` descriptions and the tables above
> highlight where to fetch each value, making it easier to hand off ownership.

## Troubleshooting

- **`setup-secrets.sh` reports missing values even after entry** – Ensure you
  entered values without trailing whitespace. The script normalises booleans but
  leaves other values verbatim; rerun and confirm the `.env` file contains the
  updated entries.
- **`validate-env.sh` exit code `2` in CI** – Optional variables are unset. This
  is expected on forks; review the warnings in the workflow summary. Add the
  secrets only if the workflow needs to run end-to-end.
- **Server exits with `missing_env`** – `srv/blackroad-api/server_full.js`
  validates required variables at startup. Check logs for the missing key and
  populate it via `.env` or the hosting environment.
- **Stripe features disabled** – The server logs an `stripe_disabled` info event
  when `STRIPE_SECRET` is absent and a `stripe_webhook_disabled` warning if the
  webhook secret is missing. Provide both secrets and set `BILLING_DISABLE=false`
  to re-enable billing flows.
- **Webhook signature errors** – Confirm `WEBHOOK_SIGNING_SECRET` matches the
  provider configuration and that the secret is URL-decoded when stored.

For additional context, see the inline comments in `.env.example` and the helper
scripts in `scripts/`.
