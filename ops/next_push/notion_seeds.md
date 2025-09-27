# Notion Seeds

## Page: Security Baseline v1
- Sections: SSO & Access, Secrets, Dependency Risk, Repo Guardrails, Monitoring.
- Links: Okta runbook, 1Password policy, Snyk policy, Branch protection SOP.

## Database: Decisions (ADR)
- Adopt Okta SSO — Choice: Okta + MFA; Impact: single front door, SCIM later.
- Block high-severity vulns on PRs — Choice: Snyk + status check.

## Database: Risks
- Secrets sprawl (Med/High) → Mitigation: 1Password + secret scanning.
- CI instability (Low/Med) → Mitigation: cache, deterministic tests.
