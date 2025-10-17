# Recover in 15 — Resilience Drill Checklist

Codex 7 mandates that the platform bends without breaking. This runbook is the minimum viable path to recover Lucidia services within fifteen minutes of a major disruption.

## Pre-Flight (Monthly)

- ✅ Verify last successful restore test is logged in the incident tracker and mirrored in `metrics_portal/`.
- ✅ Confirm immutable backup chain (3-2-1) is healthy: production snapshots in S3 (WORM), warm replica in secondary region, offline disk stored securely.
- ✅ Ensure `READ_ONLY_MODE` toggle is functional by running `resilience/read_only_mode.sh` in staging.
- ✅ Rotate contact roster and on-call bridge numbers; publish to the NOC dashboard.

## Minute 0–5 — Stabilize & Contain

1. **Detect:** Receive alert (PagerDuty/Status dashboard) confirming impact scope.
2. **Announce:** Post incident start in `#lucidia-ops` with timestamp, affected services, initial severity.
3. **Fail-Safe:** If write path instability is confirmed, toggle `READ_ONLY_MODE` via `resilience/read_only_mode.sh`.
4. **Capture:** Start incident log (OpsGenie/Notion) noting responders, suspected trigger, and current status.

## Minute 5–10 — Restore Core Services

1. **Cluster Health:** Check Kubernetes dashboard (`kubectl get pods -A`) for failing workloads; trigger redeploy on unhealthy replicas.
2. **Backups:** Validate latest snapshot integrity via `restic -r ssh:backup1:/srv/backups check --password-file /root/.restic-pass` (read-only check).
3. **Traffic Shift:** If the primary region remains degraded, execute the documented DNS or load balancer failover procedure (track automation work in `infra/ansible/playbooks/`).
4. **Self-Heal Review:** Confirm auto-recreated containers are emitting logs; escalate to manual redeploy if crash loops persist.

## Minute 10–15 — Validate & Communicate

1. **Service Tests:** Run `resilience/smoke/healthcheck.sh`; record results in the incident log and supplement with manual API/UI probes.
2. **Data Integrity:** Spot-check critical transactions in read-only mode. If corruption suspected, initiate point-in-time restore plan.
3. **Comms Update:** Publish status page update summarizing mitigation actions and next checkpoint (T+30 min).
4. **Exit Read-Only:** Once error rate <1% across all probes, disable `READ_ONLY_MODE` and monitor for five minutes.

## Post-Recovery

- File after-action review within 24 hours including metrics (time to detect, stabilize, restore).
- Archive logs to `logs/resilience/` and tag with incident ID for forensics.
- Feed improvements back into Codex 7 entry and update tooling/backups scripts as needed.

_This checklist is versioned with the Codex fingerprint `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`._
