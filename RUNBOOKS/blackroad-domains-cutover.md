# BlackRoad Domains Cutover (blackroad.io & blackroadinc.us)

_Last updated: 2025-03-21_

## Overview

This runbook captures the coordinated steps required to bring **blackroad.io** online as the primary public site and to canonicalize **blackroadinc.us** onto it. It mirrors the handoff brief shared with operations so the DNS, TLS, deploy, and health-check automation can be executed quickly and with low risk.

## 1. DNS & TLS

### blackroad.io
- Create `A` (and `AAAA` if available) records pointing at the chosen edge/CDN or origin (Netlify, Vercel, ALB, etc.).
- Map `www.blackroad.io` as a `CNAME` to the apex (or provider alias).
- Issue/attach certificates covering both `blackroad.io` and `www.blackroad.io`.
- Force HTTP→HTTPS and enable HSTS (`max-age=15552000; includeSubDomains`).

### blackroadinc.us
- Either configure a provider-level alias so the zone resolves to `blackroad.io`, **or** host a lightweight site that 301-redirects all traffic to `https://blackroad.io/`.
- Ensure TLS certificates are valid for `blackroadinc.us` and `www.blackroadinc.us`.
- Apply a canonical redirect rule: `/* → https://blackroad.io/:splat` with status `301`, preserving path and query parameters.

## 2. Frontend Deploy (Prism Console Site)
- Build from `sites/blackroad/` in this repository.
- Deploy the generated static bundle to the `blackroad.io` property.
- Include the repo-provided `_redirects`, `404.html`, `robots.txt`, `sitemap.xml`, and `status.json` files.
- Confirm SPA routing is honored (either via `_redirects` or a provider-level rule such as `/* /index.html 200`).
- Serve `404.html` for genuine misses.

## 3. Backend / Ops Surface (Optional Enhancements)
- Expose the ops API endpoints by configuring environment variables:
  - `OPS_FLAGS_ENDPOINT` (or `FLAGS_ENDPOINT` / `BR_FLAGS_URL`) for feature flags.
  - `OPS_INCIDENTS_PATH` and `OPS_INCIDENTS_URL` for incidents data.
  - Optional Slack webhook + upstream definitions to enable `POST /api/ops/:action` notifications.
- Legacy health endpoint: `GET /api/connectors/status` for quick service status.

## 4. Redirect & Canonical Strategy
- Enforce `blackroadinc.us → https://blackroad.io/` via 301 redirects.
- Within `blackroad.io`, make sure `/status` (or equivalent surface) serves the bundled `status.json` for uptime monitors.

## 5. Smoke Test Checklist
Run after DNS/TLS propagation and deploy:
- `curl -I https://blackroad.io` → expect `200` (with HSTS header if configured).
- `curl -I https://www.blackroad.io/some/spa/route` → expect `200`, verifying SPA fallback.
- `curl -I https://blackroadinc.us` → expect `301` → `https://blackroad.io/`.
- `curl https://blackroad.io/status.json` → returns JSON (uptime target).
- (If API active) `curl https://blackroad.io/api/connectors/status` → JSON containing connector health booleans.

## 6. Automation Prompts (for Codex / Ops Agents)
Use these prompt snippets with the automation agents to execute the cutover:

### Domains & Certificates
- **"Configure apex and www for blackroad.io."** — Create `A/AAAA` records, `www` CNAME to apex, attach TLS, enforce HTTPS + HSTS.
- **"Alias blackroadinc.us to blackroad.io with strict canonical redirect."** — Provision domain, attach TLS, redirect `/*` to `https://blackroad.io/:splat` (301).

### Build & Deploy
- **"Build and publish the public site from the Prism repo."** — Build `sites/blackroad`, deploy, respect `_redirects`, verify `404.html`.
- **"Set cache & headers for static assets."** — Long-cache immutable assets (`*.js`, `*.css`, `*.svg`, `*.png`, `*.jpg`), `no-cache` for `index.html`, `status.json`, `sitemap.xml`.

### SPA Routing & 404 Handling
- **"Ensure client-side routes resolve."** — Add catch-all `/* → /index.html (200)` if provider ignores `_redirects`; keep `404.html` for hard 404s.

### Ops & Status Wiring
- **"Expose flags and incidents to the site."** — Configure `OPS_FLAGS_ENDPOINT`, `OPS_INCIDENTS_PATH`, and `OPS_INCIDENTS_URL`.
- **"Add uptime target."** — Monitor `https://blackroad.io/status.json`.
- **"Wire ops actions with Slack notify."** — Configure `/api/ops/:action` upstreams + Slack webhook.

### Health Checks
- **"API pulse check."** — Execute `GET /api/connectors/status` post-deploy and record connector statuses.

### Rollback Preparedness
- **"Edge-level rollback."** — Keep previous deployment available (e.g., alias `blackroad-rollback`) and toggle traffic back if `status.json` or SPA route checks fail twice consecutively.

## 7. Rollback Notes
- Maintain the prior deployment artifact/alias until new release has been stable for at least one monitoring cycle.
- If redirect misconfiguration is detected (e.g., loops or mixed content), disable the redirect rule and re-point DNS to the rollback alias while corrections are applied.

---

**Contact:** Ops on-call via Slack `#blackroad-ops` for coordination, and Platform Engineering for DNS registrar access.
