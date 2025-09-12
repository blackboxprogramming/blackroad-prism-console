# Deploy Release Train

Purpose: Ship tagged releases from GitHub through CI/CD and update stakeholders.
Triggers: GitHub push with tag on `main`.
Preconditions: CI pipeline configured; Notion DB `{NOTION_DB}` accessible.

## Steps

1. Run CI release pipeline.
2. Create Asana task in “Release Train”.
3. Append changelog entry in Notion.
4. Post Slack update `#releases`.

## Rollback

Revert tag, cancel pipeline, update Notion and Slack with rollback note.

## KPIs

Release success rate, latency, incident count.

## Evidence

Splunk index `audit_release`, pointers in evidence bundle.
