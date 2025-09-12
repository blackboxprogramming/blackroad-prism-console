# Support Escalation & RCA

Purpose: Coordinate Sev-1/2 escalations and generate RCA packages.
Triggers: Zendesk ticket updated with severity Sev‑1 or Sev‑2.
Preconditions: Slack war-room permissions; Zoom, Jira, Notion integrations alive.

## Steps

1. Create Slack war-room and Zoom bridge.
2. File Jira incident and start Notion timeline.
3. Generate RCA template and export evidence bundle.

## Rollback

Archive war-room, close Jira incident, annotate RCA as void.

## KPIs

MTTR, RCA delivery within 5 business days.

## Evidence

Splunk index `audit_incident`, bundle `evidence/<ticket_id>/`.
