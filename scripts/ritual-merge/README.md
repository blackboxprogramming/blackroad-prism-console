# Ritual Merge Webhook

This lightweight Express server listens for GitHub webhook deliveries and dispatches
the `ritual-merge.yml` workflow whenever somebody reacts to a pull request comment
with a 🚀 emoji.

## Running locally

From the repository root:

```bash
npm install
node scripts/ritual-merge/webhook-server.js
```

Required environment variables:

| Variable | Description |
| --- | --- |
| `GH_WEBHOOK_SECRET` | Shared secret configured on the GitHub webhook. |
| `GH_TOKEN` | Token with `repo:status`, `contents:write`, and `pull_requests` scopes. |
| `PORT` | Optional port to listen on (defaults to `3000`). |
| `RITUAL_WORKFLOW_FILE` | Optional override for the workflow filename (defaults to `ritual-merge.yml`). |
| `RITUAL_WORKFLOW_REF` | Optional override for the branch/ref to dispatch (defaults to `main`). |

Expose `/webhook` to GitHub (e.g., via `ngrok http 3000`) and deliver the following
events from the repository webhook configuration:

- `issue_comment`
- `pull_request`
- `pull_request_review`
- `reaction`

A GET request to `/healthz` returns a JSON payload describing the configured
workflow name and ref so you can keep the service on a simple uptime check.
