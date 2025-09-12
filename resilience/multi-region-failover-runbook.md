# Multi-Region Failover Runbook

This document describes active–active failover between the `us-east` and `eu-west` regions.

## Preparation
- Deploy identical iPaaS workers, message queues, and secrets in both regions.
- Configure webhooks to route to the nearest healthy region.
- Replicate audit logs continuously to a secondary WORM bucket.

## Health Checks
- Each region exposes `/healthz` endpoint.
- Run periodic checks:
  ```bash
  ops/scripts/drill-multi-region.sh
  ```

## Failover Drill
1. Execute the drill script via Makefile:
   ```bash
   make -C infrastructure drill-multi-region
   ```
2. Observe DNS or feature-flag cutover to the surviving region.
3. Verify application health in the promoted region.

## Post-Drill
- Record recovery metrics in `resilience/rto_rpo_evidence.md`.
- Investigate any warnings emitted during the drill and remediate.
