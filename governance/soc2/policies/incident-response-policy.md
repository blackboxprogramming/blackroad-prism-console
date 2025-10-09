# Incident Response Policy

## Purpose
Provide a structured, repeatable approach for detecting, responding to, and learning from security incidents.

## Scope
All security, availability, and privacy incidents impacting BlackRoad systems or data.

## Requirements
- Classify incidents by severity (SEV1–SEV4) with documented criteria.
- Page the on-call engineer (PagerDuty) for SEV1/SEV2 events and notify `#security` and leadership.
- Publish status page updates for customer-impacting incidents within 30 minutes of confirmation.
- Complete a blameless post-mortem within 24 hours of resolution using the provided template.
- Track follow-up actions to completion in Asana with clear owners and due dates.

## Operational Practices
- Maintain an incident playbook covering triage, containment, eradication, and recovery steps.
- Review detection coverage quarterly and after major incidents.
- Conduct tabletop exercises annually to validate preparedness.

## How Enforced
- `policy-guard` and Terraform guardrails reduce configuration drift, lowering incident likelihood.
- `evidence-pack` archives incident artifacts (status updates, post-mortem links).
- GuardDuty, Security Hub, and CloudWatch alerts route to PagerDuty automatically.

Evidence comes from: `evidence-pack`, GuardDuty/Security Hub exports.
