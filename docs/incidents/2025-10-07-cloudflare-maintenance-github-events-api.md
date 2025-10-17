# Operational Advisory — 07 Oct 2025

This advisory covers two provider changes landing on 7–8 Oct 2025 that could surface in BlackRoad monitoring: scheduled Cloudflare edge maintenance in multiple metros and payload adjustments to GitHub's Events API. Use this note to pre-stage validation tasks and reduce alert noise while the changes roll out.

## Cloudflare: Metro Maintenance Windows
- **Scope:** Cloudflare is performing edge maintenance in the following metros. Expect transient path shifts, routing convergence, or elevated latency as traffic drains to adjacent PoPs.
  - **Vienna (VIE):** 07 Oct, 00:00–04:00 UTC
  - **Los Angeles (LAX):** 07 Oct, 08:00–14:00 UTC
  - **Salt Lake City (SLC):** 07 Oct 16:00 UTC → 08 Oct 09:00 UTC
- **Operational considerations:**
  - Global monitors that anchor in or near these metros may see brief p95 latency spikes or 5xx increases as Cloudflare re-routes sessions.
  - Synthetic checks pinned to a single metro could alert even if user traffic is automatically draining elsewhere.
  - Customers with geo-pinned firewall or Zero Trust policies should confirm failover routes remain authorized.
- **Recommended actions:**
  - Temporarily widen SLO alert thresholds for affected metros or add maintenance windows to notification tooling.
  - Verify Argo/Smart Tiering, load balancer pools, and origin health checks fail over cleanly when Cloudflare shifts traffic.
  - Capture traceroutes during the window to confirm new paths and update runbooks if the preferred egress changes.

## GitHub: Events API Payload Changes
- **Scope:** GitHub removed several low-usage fields from Events API payloads delivered to REST clients, webhooks, and GitHub Actions as of 07 Oct 2025.
- **Operational considerations:**
  - Internal dashboards, ingestion pipelines, or compliance archives that relied on deprecated fields will now receive `null` or missing keys.
  - GitHub Actions workflows that parse event payloads inline (e.g., `jq` scripts) may break if they assume the fields exist.
  - Restoring the removed data requires follow-up REST calls, which increases rate-limit consumption.
- **Recommended actions:**
  - Audit parsers and schema validations for GitHub Event payloads; update them to treat the removed fields as optional.
  - For required attributes, call the corresponding REST endpoint (e.g., `GET /repos/{owner}/{repo}/pulls/{number}`) and cache responses to limit API calls.
  - Monitor GitHub Actions logs for `KeyError`/`jq` failures triggered by the schema change and patch workflows accordingly.

---
*Prepared by: Autonomous Agent*
*Date: 07 Oct 2025*
