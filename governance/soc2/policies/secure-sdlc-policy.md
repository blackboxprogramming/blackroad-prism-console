# Secure SDLC Policy

## Purpose
Integrate security controls throughout the software development lifecycle to prevent vulnerabilities from reaching production.

## Scope
All application and infrastructure codebases owned by BlackRoad.

## Requirements
- Run automated security scanning (Snyk, Dependabot, GitHub Advanced Security) on every pull request.
- Enforce CODEOWNERS for critical components to guarantee qualified review.
- Maintain build pipelines that complete within 10 minutes; block merges on failing scans or tests.
- Track remediation of high and critical vulnerabilities with owners and due dates.

## Operational Practices
- Document threat models for major features; review annually.
- Use feature flags and canaries to limit blast radius.
- Keep dependency manifests up to date using scheduled Dependabot updates.

## How Enforced
- `policy-guard` verifies branch protections so CI and security checks must pass.
- `evidence-pack` captures the monthly Snyk summary for auditors.
- `env-guard` prevents accidental references to production secrets in development branches.

Evidence comes from: `policy-guard`, `env-guard`, `evidence-pack`.
