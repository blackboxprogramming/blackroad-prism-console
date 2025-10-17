# Custodianship Guidelines

Lucidia’s systems, communities, and knowledge bases are entrusted to maintainers as a shared inheritance. These guidelines translate the Custodianship Code into day-to-day practice so that every contributor helps the project endure and flourish.

## Core Responsibilities
- **Tend Before You Expand:** Prioritize resolving incidents, debt, and regressions before pursuing new feature work.
- **Document As You Go:** Update runbooks, READMEs, and architecture notes when changes ship. Unwritten knowledge is a liability.
- **Design for Succession:** Avoid one-person bottlenecks by pairing on critical work, distributing credentials, and ensuring automation scripts are reproducible.
- **Invite Contribution:** Label approachable issues, offer mentorship, and respond to questions within two business days.
- **Surface Decisions:** Record significant choices (architecture, security, governance) in the public decision log referenced by the Governance Charter.

## Rot Review Ritual
- Create or update quarterly “rot review” issues for infrastructure, documentation, and culture.
- Track findings in a shared board and assign remediation owners with target dates.
- Escalate unresolved items older than one quarter during governance syncs.

## Secrets & Continuity
- Store credentials in the approved secrets manager with access shared across at least two custodians.
- Rotate access when roles change and document the rotation in the continuity ledger.
- Keep an encrypted escrow package updated so emergency stewards can recover critical systems without delay.

## Mentorship & Onboarding
- Pair new contributors with experienced maintainers for their first two merged changes.
- Provide clear feedback expectations and celebrate milestones publicly to reinforce open participation.
- Encourage mentees to co-lead future onboarding cycles to keep knowledge circulating.

## Accountability
- Review adherence to these guidelines during quarterly governance retros.
- Capture exceptions, lessons learned, and follow-up actions in the governance record so the community can audit stewardship.

_Tagline: We hold it, we tend it, we pass it on._
