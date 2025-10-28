# Access Control Policy

## Purpose
Ensure that only authorized individuals access BlackRoad systems and data with the least privilege necessary.

## Scope
All workforce members, contractors, applications, and infrastructure that interact with BlackRoad data.

## Requirements
- Centralize authentication through Okta SSO with enforced MFA for every user.
- Provision access based on documented roles; require approvals captured in Asana or ticketing.
- Review access for AWS, Okta, GitHub, and 1Password at least quarterly.
- Disable or remove access for departing personnel within 24 hours.
- Limit production break-glass accounts; require dual approval and post-usage review.

## Operational Practices
- Maintain system ownership in the control catalog with accountable reviewers.
- Use automated onboarding/offboarding workflows to apply standard access packages.
- Log all administrative actions for later review via CloudTrail and Okta logs.

## How Enforced
- The `access-review` GitHub Action collects quarterly exports and packages evidence for reviewers.
- `policy-guard` validates repository settings that support least privilege (protected branches, required reviews).
- Terraform guardrails block public S3 buckets and enforce encryption, aligning with least privilege.

Evidence comes from: `access-review`, `policy-guard`.
