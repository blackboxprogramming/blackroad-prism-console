# MIRROR_CLASS_LIMIT Runbook

**Owner:** SecOps Eng Duty <secops@corp>

## Summary

Blocks mirror actions that target repositories classified as `restricted` or `secret`. Mirrors to those repositories risk copying sensitive IP to uncontrolled destinations.

## Triage

1. Confirm the target repository's classification in the registry.
2. Reach out to the requestor listed in the violation payload.
3. If the mirror is required, coordinate an exception review with data governance.

## Remediation

- If the classification is incorrect, update the metadata and re-run the action.
- If the mirror is legitimate, file an exception ticket and add it to the allowlist rotation job.
- Otherwise, document the deny event and notify the product security list.

## Related Dashboards

- `dashboards/grafana-rule-board.json` — Mirror Guard panel.
