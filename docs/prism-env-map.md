# PRISM deployment environment variable map

This table summarizes where the PRISM console keeps deployment-related secrets for the two deployment topologies described in the integration guidance. Use it as a drop-in reference for runbooks.

## Option A – Vercel + GitHub + Jira

### Vercel project variables

| Variable | Purpose | Notes |
| --- | --- | --- |
| `ASANA_TOKEN` | Authenticates automation calls that run from Vercel serverless functions. | Scope to the production environment; rotate via the Asana developer console. |
| `ASANA_PROJECT_ID` | Routes automation updates to the correct Asana project. | Match the ID used by the GitHub→Asana automations. |
| `SLACK_WEBHOOK_URL` | Posts deploy/preview notifications triggered by Vercel. | Use a channel-specific webhook generated in Slack. |

### GitHub repository secrets & variables

| Variable | Type | Purpose | Notes |
| --- | --- | --- | --- |
| `TOOLS_ADAPTER_URL` | Secret | Gives GitHub Actions the internal adapter endpoint for ticketing hooks. | Consumed by CI workflows; keep only in GitHub. |
| `ASANA_TOKEN` | Secret | Reused by GitHub workflows that need to sync with Asana. | Store the same token as above to avoid cross-system drift. |
| `ASANA_PROJECT_ID` | Variable | Lets GitHub metadata jobs annotate the right Asana project. | Plain project ID; safe to expose as a repo variable. |
| `SLACK_WEBHOOK_URL` | Secret | Enables GitHub workflow notifications to Slack. | Separate webhook from the Vercel one if you need channel isolation. |

## Option B – Hybrid (Vercel frontend, DigitalOcean backend)

Keep the Option A values and add the following backend-specific entries.

### GitHub repository secrets & variables

| Variable | Type | Purpose | Notes |
| --- | --- | --- | --- |
| `DO_ACCESS_TOKEN` | Secret | Authenticates the `doctl` GitHub Action during backend deploys. | Generate from the DigitalOcean control panel with write access. |
| `DO_REGISTRY` | Variable | Container registry namespace for API images. | Matches the slug shown in the DO container registry. |
| `DO_CLUSTER` | Secret | Identifies the DigitalOcean Kubernetes cluster for rollouts. | Required only when deploying to Kubernetes. |

### DigitalOcean App/Platform configuration

| Variable | Purpose | Notes |
| --- | --- | --- |
| `DIGITALOCEAN_API_KEY` | Allows the DO App Platform to fetch private repos during build. | Add under **App Settings → Environment Variables**. |
| `API_INTERNAL_SECRET` | Shared secret for API↔frontend communication. | Mirror the value in Vercel as a private env var if the frontend calls the API. |

### Domain pointers

- `app.blackroad.io` → Vercel project (CNAME).
- `api.blackroad.io` → DigitalOcean service (A/AAAA or CNAME to load balancer).

Ensure the API responds with CORS headers that include the Vercel domain so browser calls succeed.
