# Bug Backlog

## BR-001 – Live site returning 503s
- **Severity:** High
- **Owner/Area:** frontend/website
- **Location:** Public BlackRoad marketing site (`blackroadinc.us`) / `sites/blackroad-next`
- **Summary:** Initial verification of the public site surfaced 503 responses, signalling infrastructure instability that blocks end-user access.
- **Reproduction:**
  1. Run `curl -I https://blackroadinc.us/` (or load the homepage in a browser).
  2. Observe the 503 Service Unavailable response.
- **Source:** docs/blackroad-website-plan.md (risk register + notes).

## BR-002 – Cloudflare tunnel health check false negatives
- **Severity:** Medium
- **Owner/Area:** infrastructure/networking
- **Location:** Cloudflare Magic Transit & Magic WAN tunnel health monitoring
- **Summary:** Cloudflare reported degraded tunnel health monitoring where checks flap or report false negatives, risking noisy alerts and unintended failovers.
- **Reproduction:**
  1. During the 03 Oct 2025 incident window, inspect Magic Transit/WAN tunnel health status in Cloudflare dashboards or via API.
  2. Note health checks reporting down state while data-plane traffic continues to flow normally.
- **Source:** docs/incidents/2025-10-03-cloudflare-github-copilot.md.

## BR-003 – GitHub Events API payload schema change breaks workflows
- **Severity:** Medium
- **Owner/Area:** devex/ci-platform
- **Location:** GitHub webhook consumers & Actions workflows parsing Events API payloads
- **Summary:** GitHub removed low-usage fields from Events API payloads, which can cause schema-dependent parsers or CI automations to throw errors.
- **Reproduction:**
  1. Trigger a GitHub webhook or Actions workflow that assumes deprecated payload fields exist (e.g., parse with `jq`).
  2. Observe missing keys/`KeyError` failures and the need to fetch the data via follow-up REST calls.
- **Source:** docs/incidents/2025-10-07-cloudflare-maintenance-github-events-api.md.

---
_No additional actionable issues were identified in `AGENT_WORKBOARD.md`, `CLEANUP_RESULTS.md`, or `logs/` during this pass._
