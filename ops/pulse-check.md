# Release Pulse Check Checklist

This checklist captures the pre-merge sweep described in the latest release coordination notes. Use it to document status before promoting a change to `main`.

## 1. Security Sanity Sweep
- [ ] Scrub recent logs and configuration diffs for embedded credentials, tokens, API keys, or secrets.
- [ ] Confirm sensitive environment variables are masked in CI logs and deployment manifests.
- [ ] Validate agent and service accounts operate with least-privilege scopes.

### Reference Commands
- `git diff --stat HEAD~1` to spot unexpected config churn.
- `rg --hidden --no-ignore "(AWS|BLACKROAD|TOKEN|SECRET)" logs/ config/` for accidental leaks.
- Review IAM policies in `ops/` manifests for overly broad permissions.

## 2. Test and Verification Pass
- [ ] Re-run automated test suites with focus on authentication, authorization, and timeout boundaries.
- [ ] Capture and archive test artifacts (HTML, JUnit, coverage) for traceability.
- [ ] Spot-check regression-prone flows (login, permissions escalation, API retries).

### Reference Commands
- `npm test` or `pnpm test --filter auth` depending on workspace target.
- `pytest tests/auth` for Python-bound checks.
- `npm run lint` for UI validation when the PR touches console components.

## 3. Merge Plan Alignment
- [ ] Cross-check open PRs against `MERGE_PLAN.md` for conflicts or dependency ordering.
- [ ] Ensure merge sequencing honors shared infrastructure (API, bridge, UI).
- [ ] Confirm reviewers have signed off and status checks are green.

## 4. Deployment Readiness & Monitoring
- [ ] Prepare staged deploy target (staging or canary) and verify environment parity.
- [ ] Validate CI/CD workflows succeed end-to-end (build, scan, deploy steps).
- [ ] Schedule telemetry watch window and alert on anomaly spikes immediately after go-live.

## 5. Follow-up Actions
- [ ] Review dependency manifests for unintended upgrades; lock versions if necessary.
- [ ] Document any deviations or risks in the release notes or runbook.
- [ ] Communicate status in the release thread; silence after checklist completion signals go-ahead.

---
_Use this document as a living checklist. Update each item with status notes or links to supporting evidence during the release pulse check._
