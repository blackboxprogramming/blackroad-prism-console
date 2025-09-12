## Summary
Bootstrap infra/flows/monitors/runbooks (autogen). Evidence in /evidence.

## Changes
- infra/: Terraform modules (Okta/Datadog/Snowflake/Asana)
- flows/: iPaaS YAML (retries, idempotency, DLQ, tests)
- monitors/: Datadog JSON + Splunk searches
- runbooks/: SOPs + rollback
- profiles/: env profiles + ring controller
- evidence/: plan/diff/monitors/samples/hash.sig/pointers.csv

## Checks
- [ ] CI passed
- [ ] Evidence bundle uploaded (WORM) & pointers in Splunk
- [ ] Ring plan: canary → pilot → broad
