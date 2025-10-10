# GitHub Access Hardening SOP

This standard operating procedure applies to all repositories under the BlackRoad GitHub organization. It defines how we provision, review, and retire credentials used by humans, automations, and third-party agents.

## 1. Token Strategy
- **Prefer ephemeral credentials.** Use the repository-provided `GITHUB_TOKEN` for GitHub Actions and in-house automations whenever possible.
- **Issue fine-grained personal access tokens (PATs) per task or agent** when an external integration cannot use `GITHUB_TOKEN`. Scope each token to the minimal set of repositories it needs and grant only the permissions required (e.g., `Contents: Read & Write`, `Metadata: Read`).
- **Sunset classic PATs.** Existing classic tokens must be replaced with fine-grained equivalents unless a feature gap prevents the migration. Document the exception and track it in the token inventory.

## 2. Organization Controls
- Enable mandatory approval for fine-grained PATs requesting organization access (Org Settings → Personal access tokens → Fine-grained → Require approval).
- Block or strictly restrict classic PAT issuance at the organization level and enforce maximum token lifetimes.
- Review pending token approval requests weekly; reject scopes that exceed documented needs.

## 3. Secret Scanning Push Protection
- Enable secret scanning with push protection at the organization level (Settings → Code security → Secret scanning → Enable push protection).
- Require contributors to remediate flagged secrets or provide policy-justified bypass notes captured in the audit log.

## 4. Workflow Guidance
- Build pipelines and bots must authenticate with the repository `GITHUB_TOKEN` unless they require cross-repository write access.
- External agents needing repository updates must use distinct fine-grained PATs per repository, never organization-wide tokens.
- Rotate tokens at least quarterly or immediately after a personnel or vendor change.

## 5. Token Inventory & Review Cadence
Maintain a living inventory covering every token:
- Owner + escalation contact
- Purpose and dependent automations
- Repository scope and granted permissions
- Creation date, last-used timestamp, planned rotation date
- Emergency revoke procedure

Audit the inventory quarterly. Revoke unused tokens and confirm that documented scopes still meet least-privilege requirements. Record audit results in the security runbook.

## 6. Incident Response
- If a token is suspected compromised, revoke it immediately via the organization token dashboard and rotate any downstream secrets.
- Trigger the security incident response playbook, including credential rotation for dependent systems and post-incident review.
- Document lessons learned and update this SOP as needed.
