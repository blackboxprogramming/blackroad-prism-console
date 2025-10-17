# Ollama bridge roll forward / rollback

_Last reviewed: 2025-10-05_

The Ollama bridge is deployed as a Fly.io application (`blackroad-ollama-bridge`).
This runbook captures the fast path for promoting a new release, verifying it,
and rolling back when required.

## Prerequisites

- Fly CLI installed locally (`brew install flyctl` or follow https://fly.io/docs/hands-on/install-flyctl/).
- `FLY_API_TOKEN` with deploy rights to `blackroad-ollama-bridge`.
- Access to the upstream Ollama runtime URL for verification (usually provided via the `OLLAMA_BASE_URL` secret).

## Roll forward (promote new build)

1. Ensure the desired commit is merged to `main`.
2. Trigger the GitHub workflow **Deploy Ollama Bridge** or run locally:
   ```bash
   flyctl deploy --config deploy/fly/ollama-bridge/fly.toml --image-label $(git rev-parse HEAD)
   ```
3. Watch the deploy logs for health check success and machine start.
4. Verify runtime health:
   ```bash
   curl --fail https://blackroad-ollama-bridge.fly.dev/api/llm/health
   curl --fail https://blackroad-ollama-bridge.fly.dev/api/codex/identity
   ```
5. Confirm upstream Ollama responds with the expected model:
   ```bash
   flyctl ssh console --app blackroad-ollama-bridge --command \
     "curl -s ${OLLAMA_BASE_URL:-http://127.0.0.1:11434}/api/tags"
   ```
6. Announce success in `#eng` with the commit SHA and release notes.

## Rollback

1. List recent releases to identify the healthy image label:
   ```bash
   flyctl releases --app blackroad-ollama-bridge
   ```
2. Deploy the known-good release:
   ```bash
   flyctl deploy --config deploy/fly/ollama-bridge/fly.toml --image <image_label>
   ```
   - Alternatively, rerun the GitHub workflow and set the `image_label` input to
     the desired release tag.
3. Monitor the deploy logs and rerun the health checks above.
4. Update incident notes or the deployment channel with the rollback status.

## Policy gates

- Production deploys require approval through `.github/workflows/change-approve.yml`.
- Secrets (`FLY_API_TOKEN`, `OLLAMA_BASE_URL`) must remain scoped to the
  deployment workflow and Fly app; do not copy them into repositories or logs.
- After three consecutive failures, pause further deploys and escalate to the
  on-call engineer for investigation.
