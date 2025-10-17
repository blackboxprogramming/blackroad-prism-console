# Operations Advisory — 07 Oct 2025

This advisory captures provider changes that could influence BlackRoad observability, automation, and developer tooling between 7–8 Oct 2025. Teams should validate monitoring visibility in Cloudflare metros undergoing maintenance and confirm GitHub integrations continue to receive required metadata after the Events API update.

## Cloudflare: Scheduled Maintenance in VIE, LAX, and SLC
- **Maintenance windows**:
  - Vienna (VIE): 07 Oct 2025 00:00–04:00 UTC
  - Los Angeles (LAX): 07 Oct 2025 08:00–14:00 UTC
  - Salt Lake City (SLC): 07 Oct 2025 16:00 UTC → 08 Oct 2025 09:00 UTC
- **Expected impact**:
  - Transient routing shifts or latency spikes while traffic drains between metros.
  - Temporary increases in HTTP 5xx rates or elevated p95 latency for workloads pinned to the impacted regions.
- **Recommended actions**:
  - Confirm dashboards and alerting for Cloudflare PoPs include Vienna, Los Angeles, and Salt Lake City so any anomalies surface quickly.
  - Review error-budget burn alerts and expand suppression windows if maintenance-triggered jitter would create noise.
  - Validate fallback origins or secondary CDN paths for critical services that depend on these metros.

## GitHub: Events API Payload Reductions
- **Change date**: 07 Oct 2025 (effective immediately).
- **Highlights**:
  - Select fields are being removed from Events API payloads for performance reasons.
  - Event payloads consumed by GitHub Actions will mirror the trimmed schema.
  - Data removed from the event stream must now be fetched via dedicated REST API calls.
- **Recommended actions**:
  - Audit internal webhooks, CI automations, and dashboards for references to soon-to-be-missing fields; migrate to REST API lookups where required.
  - Re-run contract tests for any integrations parsing GitHub event JSON to ensure they fail loudly if a field disappears.
  - Update documentation for developer teams that rely on GitHub Actions context variables derived from Events API payloads.

---
*Prepared by: Autonomous Agent*
*Date: 07 Oct 2025*
