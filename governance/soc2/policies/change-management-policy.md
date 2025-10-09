# Change Management Policy

## Purpose
Promote safe, auditable changes to production systems while maintaining delivery speed.

## Scope
All infrastructure, application, and configuration changes impacting production workloads.

## Requirements
- Every change must originate from a tracked ticket or pull request with documented context.
- Pull requests require at least one peer review and successful CI (`policy-guard` enforces branch protections).
- Releases follow the Go/No-Go checklist with canary verification before full rollout.
- Emergency changes follow the documented runbook, with post-implementation review within 24 hours.
- Maintain a change log via GitHub Releases; link to canary evidence and rollback steps.

## Operational Practices
- Use CODEOWNERS to ensure the right reviewers for sensitive services.
- Capture deployment notes, risk, and rollback plan using the major change ticket template.
- Store canary screenshots and deployment metrics in the Evidence page.

## How Enforced
- `policy-guard` ensures repository settings require reviews and green CI before merging.
- `evidence-pack` exports releases and CI runs monthly for audit support.
- Terraform guardrails prevent non-compliant infrastructure changes by failing CI on policy violations.

Evidence comes from: `policy-guard`, `evidence-pack`.
