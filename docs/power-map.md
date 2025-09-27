# Power Map

The power map keeps Lucidia’s elevated roles, permissions, and holders in public view. Update it whenever access changes so the community can see who is accountable for each lever.

## Roles and Custodians
| Role | Scope of Authority | Current Holders | Last Verified |
| ---- | ------------------ | ---------------- | ------------- |
| _Example:_ Governance Maintainer | Merges to governance repos, approves charter updates | _TBD_ | _YYYY-MM-DD_ |

> Replace the example entry with the actual roster and review date. Every privileged role should appear here with a plain-language description of its reach.

## Permission Catalog
Document how each role maps to systems (repositories, infrastructure, services). Include links to IAM policies or runbooks when available.

- Platform Admin — production Kubernetes clusters (`infra/k8s`), secrets manager rotation scripts.
- Governance Maintainer — `governance` repo, `/docs/decisions.md` automation workflows.
- Security Custodian — audit log configuration, dual-control key rotation tooling.

Update the list as new roles or capabilities emerge.

## Visibility & Alerts
- Changes to this file should trigger review from governance and security custodians.
- Pair updates with logging changes so privileged actions always record `actor role + action + timestamp`.
- Announce roster updates in the public status channel to keep the community informed.

## Dual Control Register
List actions that require multiple approvers and note the second set of eyes responsible for confirmation.

| Sensitive Action | Primary Role | Secondary Role | Validation Method |
| ---------------- | ------------ | -------------- | ---------------- |
| _Example:_ Production key rotation | Platform Admin | Security Custodian | Joint approval recorded in audit log |

Keep this register synchronized with runbooks and the automation enforcing dual control.

## Revocation Procedure
Link to the steps the community follows to challenge or revoke access:

1. File a governance issue describing the concern and evidence.
2. Governance maintainers acknowledge within 24 hours and freeze the implicated access if risk is high.
3. Conduct a public review, recording findings in `/docs/decisions.md`.
4. Update this power map with the new custodian assignments.

Transparency only works when updates are prompt—ensure each phase leaves an auditable trail.
