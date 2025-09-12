# Opp → Task → Slack

Purpose: auto-create tasks + notify on stage changes.
Triggers: Salesforce `Opportunity.updated` (Negotiation/Closed Won)
Preconditions: Asana project exists; Slack channel accessible; secrets loaded.
Steps: validate payload → idempotency check → create task → post Slack → record evidence.
Rollback: delete task, post correction, flag record in Splunk.
KPIs: latency p50/p95; success rate; tasks SLA; dedupe count.
Evidence: Splunk `audit_integrations`, pointers.csv in evidence bundle.
