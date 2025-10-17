# All Connections Orchestrator Setup

## Linear Seed

| Team | Labels | Workflow | Projects |
| --- | --- | --- | --- |
| Implementation – MasterPack | fix, enhance, debug, status, automation | Backlog → Planned → In Progress → Review → Done | MasterPack |
| GRC – Evidence Calendar | fix, enhance, debug, status, audit | Backlog → Planned → In Progress → Review → Done | Evidence Calendar |
| Release Train | fix, enhance, debug, status, release | Backlog → Planned → In Progress → Review → Done | Release Train |
| Customer Onboarding | fix, enhance, debug, status, onboarding | Backlog → Planned → In Progress → Review → Done | Onboarding |
| OKRs – Company 2025 | fix, enhance, debug, status, okr | Backlog → Planned → In Progress → Review → Done | Company 2025 OKRs |

---

## Bot Registry

| Bot | Webhook | Commands |
| --- | --- | --- |
| linear-hq | `/api/bot/linear-hq` | create_issue, create_subtasks, attach_plan, attach_tests, attach_evidence, update_status, post_backlinks |
| slack-ops | `/api/bot/slack-ops` | `@codex fix|enhance|debug`, `/codex status`, message_action: Send to Linear |
| github-autopilot | `/api/bot/github-autopilot` | open_pr_from_plan, apply_labels, request_review, attach_evidence, auto_merge_on_green |
| notion-docs | `/api/bot/notion-docs` | spawn_linear_epic, create_tasks, sync_decision, weekly_ceo_update |
| asana-sync | `/api/bot/asana-sync` | mirror_to_linear, bidirectional_until_done |
| jira-sync | `/api/bot/jira-sync` | mirror_to_linear, war_room_link |
| salesforce-bot | `/api/bot/salesforce-bot` | asana_task, slack_notify, update_linear |
| hubspot-bot | `/api/bot/hubspot-bot` | sync_salesforce, create_tasks, update_dashboards |
| stripe-finops | `/api/bot/stripe-finops` | provision_flags, product_api, revenue_to_dw, finance_alerts |
| netsuite-bridge | `/api/bot/netsuite-bridge` | revenue_checks, export_to_dw, weekly_finance_pdf |
| workday-iam | `/api/bot/workday-iam` | okta_scim, access_profiles, training_tasks, revoke_on_term |
| datadog-slo | `/api/bot/datadog-slo` | open_linear, attach_graphs, auto_remediate, freeze_promotions, require_rca |
| splunk-audit | `/api/bot/splunk-audit` | index_pointers, schedule_reports, feed_grc |
| figma-writer | `/api/bot/figma-writer` | snapshot_to_notion, asana_tasks |
| io-ingest | `/api/bot/io-ingest` | normalize, route_to_dw, threshold_alerts |

---

## Flow YAML (staging & prod)

```yaml
version: 1
profiles:
  staging:
    env: staging
  prod:
    env: prod

flows:
  opp_to_task_notify:
    trigger: salesforce.opportunity.updated(stage in ["Negotiation","Closed Won"])
    actions:
      - asana.task.create(project: "GTM-Pipeline", assignee: "{{owner}}", due: "{{closeDate}}")
      - slack.post(channel: "#sales-updates", text: ":rocket: {{name}} → {{stage}}")
    observability:
      metrics: [flow.total, flow.success, flow.latency_ms]
      logs: {splunk: "audit_integrations"}
    idempotency: {key: "sf_{{id}}_{{stage}}"}
    retries: {attempts: 3, exp: true}
    dlq: "dlq_opp"

  hubspot_to_salesforce_sync:
    trigger: hubspot.contact.created
    actions:
      - salesforce.lead.upsert
      - asana.task.create
      - slack.post("#announcements")

  zendesk_sev_escalation:
    trigger: zendesk.ticket.updated(severity in ["Sev-1","Sev-2"])
    actions:
      - slack.war_room.create("#support-war-room")
      - zoom.create
      - jira.incident.create
      - rca.generate
    slo: {mttr_h_lte: 2, rca_due_days: 5}

  release_train:
    trigger: github.push(branch: "main", tag: true)
    actions:
      - ci.run: release
      - asana.task.create(project: "Release Train")
      - notion.append(changelog)
      - slack.post("#releases")
    on_failure:
      - jira.incident.create
      - pagerduty.page

  snyk_to_pr:
    trigger: snyk.vuln.detected
    actions:
      - github.pr.patch
      - slack.post
      - asana.task.create

  product_events_to_dw:
    trigger: app.events(stream: "product")
    actions:
      - etl.load(snowflake.table: "product_events")
      - datadog.gauge("ingest.rate")
      - slack.post("#data-ops")
    freshness: "D+0 06:00 UTC"

  vertexai_batch_inference:
    trigger: schedule(cron: "0 2 * * *")
    actions:
      - vertexai.run
      - snowflake.upsert("predictions")
      - datadog.metrics
      - slack.post

  stripe_paid_to_provision:
    trigger: stripe.invoice.paid
    actions:
      - launchdarkly.flag.enable
      - product.api.post(/tenants)
      - customerio.trigger
      - netsuite.sync
      - dw.insert("revenue_events")
      - slack.post("#announcements")
    idempotency: {key: "stripe_{{invoice.id}}"}

  brex_ramp_spend_to_dw:
    trigger:
      - brex.txn.posted
      - ramp.txn.posted
    actions:
      - quickbooks.post
      - netsuite.post
      - dw.insert("spend_events")
      - finops.alerts

  hire_to_access:
    trigger: workday.hire.created
    actions:
      - okta.scim.provision(groups: ["ENG","REVOPS","FINANCE"])
      - asana.project.onboarding
      - slack.post("#announcements")

  figma_export_to_notion:
    trigger: figma.file.versioned
    actions:
      - notion.embed
      - asana.task.create(review)
      - slack.post

  edge_telemetry_threshold:
    trigger: iot.telemetry(device in [Jetson,Pi,Arduino,ESP32], threshold_exceeded: true)
    actions:
      - slack.post("#ops")
      - jira.issue.create
      - dw.insert("iot_events")
      - datadog.event

  social_to_crm:
    trigger: social.metric.delta(channel in [X,LinkedIn,YouTube], change_gt: threshold)
    actions:
      - hubspot.campaign.note
      - salesforce.campaign.update
      - slack.post("#announcements")
```

---

## Coverage Report

| Tool | SSO via Okta/Auth0 | Active Flow Touchpoints |
| --- | --- | --- |
| Webflow | ✅ | Webflow forms → HubSpot/Salesforce → Asana → Slack |
| App Store Connect | ✅ | Release Train (tag pushes) |
| Vercel | ✅ | Website/Portal deployment (implicit via release workflow) |
| Cloudflare | ✅ | Website/Portal edge security (implicit) |
| Zapier | ✅ | Automation hub (triggered via flows) |
| Make | ✅ | Automation hub |
| n8n | ✅ | Automation hub |
| Airflow | ✅ | Automation hub |
| DigitalOcean | ✅ | droplet-manager-macos, hosting infrastructure |
| AWS | ✅ | Terraform, Kubernetes, IoT, etc. |
| GCP | ✅ | Terraform, BigQuery, Vertex AI |
| Azure | ✅ | Terraform |
| S3 | ✅ | Data lake storage via product events |
| RDS/Cloud SQL | ✅ | Data flows via ETL |
| Kubernetes | ✅ | GitHub → Jenkins → Docker → Kubernetes → Datadog |
| GitHub | ✅ | Release Train, snyk_to_pr, GitHub autopilot |
| GitLab | ✅ | (No flow yet) → **Coverage Gap – GitLab** |
| Docker | ✅ | CI pipelines |
| Postman | ✅ | API testing (implicit) |
| Replit | ✅ | Dev environment (implicit) |
| TestFlight | ✅ | Release Train (mobile) |
| Working Copy | ✅ | Developer tooling |
| Shellfish | ✅ | Developer tooling |
| Jenkins | ✅ | GitHub -> Jenkins pipeline |
| Terraform | ✅ | Terraform -> AWS/GCP/Azure |
| Slack | ✅ | Many flows: notifications, war rooms |
| Microsoft Teams | ✅ | Teams <-> Asana |
| Discord | ✅ | Collaboration channel (implicit) |
| Outlook | ✅ | Email (implicit) |
| Telegram | ✅ | Collaboration (implicit) |
| Zoom | ✅ | zendesk_sev_escalation |
| Google Workspace | ✅ | Collaboration (implicit) |
| Atlassian (Jira) | ✅ | Slack <-> Jira sync |
| Asana | ✅ | Multiple flows: opp_to_task, etc. |
| ClickUp | ✅ | (No flow yet) → **Coverage Gap – ClickUp** |
| Monday | ✅ | (No flow yet) → **Coverage Gap – Monday** |
| Notion | ✅ | notion-docs bot, figma_export_to_notion |
| Trello | ✅ | (No flow yet) → **Coverage Gap – Trello** |
| Linear | ✅ | Source of truth, all @codex |
| Salesforce | ✅ | opp_to_task, hubspot sync, etc. |
| Marketing Cloud | ✅ | HubSpot ↔ Salesforce |
| HubSpot | ✅ | hubspot_to_salesforce_sync |
| Zendesk | ✅ | zendesk_sev_escalation |
| Intercom | ✅ | Intercom -> Slack |
| Smartsheet | ✅ | (No flow yet) → **Coverage Gap – Smartsheet** |
| Dropbox | ✅ | (No flow yet) → **Coverage Gap – Dropbox** |
| Airtable | ✅ | (No flow yet) → **Coverage Gap – Airtable** |
| Figma | ✅ | figma_export_to_notion |
| FigJam | ✅ | figma_writer |
| Adobe CC | ✅ | (No flow yet) → **Coverage Gap – Adobe CC** |
| Affinity | ✅ | (No flow yet) → **Coverage Gap – Affinity** |
| Canva | ✅ | (No flow yet) → **Coverage Gap – Canva** |
| JupyterHub | ✅ | (No flow yet) → **Coverage Gap – JupyterHub** |
| Kaggle | ✅ | (No flow yet) → **Coverage Gap – Kaggle** |
| BigQuery | ✅ | product_events_to_dw |
| Snowflake | ✅ | product_events_to_dw, vertexai_batch_inference, dw inserts |
| Databricks | ✅ | databricks → Snowflake |
| Vertex AI | ✅ | vertexai_batch_inference |
| Hugging Face | ✅ | (No flow yet) → **Coverage Gap – Hugging Face** |
| Elasticsearch | ✅ | App services |
| Redis | ✅ | App services |
| Stripe | ✅ | stripe_paid_to_provision |
| PayPal | ✅ | (No flow yet) → **Coverage Gap – PayPal** |
| QuickBooks | ✅ | brex_ramp_spend_to_dw, stripe Paid flows |
| NetSuite | ✅ | stripe_paid_to_provision, netsuite-bridge |
| Brex | ✅ | brex_ramp_spend_to_dw |
| Ramp | ✅ | brex_ramp_spend_to_dw |
| Bill.com | ✅ | Bill.com -> NetSuite |
| Wise | ✅ | Wise -> QuickBooks |
| Workday | ✅ | hire_to_access |
| Gusto | ✅ | (No flow yet) → **Coverage Gap – Gusto** |
| BambooHR | ✅ | (No flow yet) → **Coverage Gap – BambooHR** |
| Greenhouse | ✅ | Greenhouse -> Workday/Okta |
| Lever | ✅ | Lever -> Workday/Okta |
| Deel | ✅ | (No flow yet) → **Coverage Gap – Deel** |
| Rippling | ✅ | hire_to_access (Workday|Rippling) |
| Okta | ✅ | IdP core |
| Auth0 | ✅ | IdP core |
| Snyk | ✅ | snyk_to_pr |
| Splunk | ✅ | splunk-audit, observability logs |
| Datadog | ✅ | datadog-slo, product_events_to_dw |
| Prisma Cloud | ✅ | (No flow yet) → **Coverage Gap – Prisma Cloud** |
| New Relic | ✅ | datadog|new relic alerts -> Slack|Linear |
| Confluence | ✅ | Confluence ↔ Linear |
| Notion Wiki | ✅ | notion-docs |
| Udemy | ✅ | (No flow yet) → **Coverage Gap – Udemy** |
| Coursera | ✅ | (No flow yet) → **Coverage Gap – Coursera** |
| edX | ✅ | (No flow yet) → **Coverage Gap – edX** |
| NVIDIA Jetson/Orin | ✅ | edge_telemetry_threshold |
| Raspberry Pi | ✅ | edge_telemetry_threshold |
| Arduino | ✅ | edge_telemetry_threshold |
| ESP32 | ✅ | edge_telemetry_threshold |
| X | ✅ | social_to_crm |
| LinkedIn | ✅ | social_to_crm |
| YouTube | ✅ | social_to_crm |

### Coverage Gap Follow-ups

| Gap | Owner | Linear Issue | Due | Notes |
| --- | --- | --- | --- | --- |
| GitLab | Platform Ops | Coverage Gap – GitLab | 2025-09-30 | Mirror repos into GitHub + Jenkins and federate SSO. |
| ClickUp | BizOps | Coverage Gap – ClickUp | 2025-09-30 | Stand up ClickUp ↔ Linear sync with audit logging. |
| Monday | BizOps | Coverage Gap – Monday | 2025-10-04 | Build webhook bridge and attach CAB evidence bundle. |
| Trello | BizOps | Coverage Gap – Trello | 2025-10-04 | Route Trello cards into Linear with acceptance/test templates. |
| Smartsheet | RevOps | Coverage Gap – Smartsheet | 2025-10-07 | Enable Smartsheet connector + Splunk evidence pointers. |
| Dropbox | Security | Coverage Gap – Dropbox | 2025-10-07 | Enforce Okta SSO and evidence export into ACO data lake. |
| Airtable | RevOps | Coverage Gap – Airtable | 2025-10-09 | Provision Airtable API bot + nightly sync flow. |
| Adobe CC | Design | Coverage Gap – Adobe CC | 2025-10-09 | Enable Adobe SSO and route assets into Notion evidence hub. |
| Affinity | GTM | Coverage Gap – Affinity | 2025-10-11 | Automate Affinity deal updates into Salesforce + Slack. |
| Canva | Design | Coverage Gap – Canva | 2025-10-11 | Connect Canva exports into Asana review queue. |
| JupyterHub | Data Platform | Coverage Gap – JupyterHub | 2025-10-14 | Wire SSO + notebook artifact archival. |
| Kaggle | Data Platform | Coverage Gap – Kaggle | 2025-10-14 | Mirror Kaggle runs into Vertex AI metrics with evidence. |
| Hugging Face | AI | Coverage Gap – Hugging Face | 2025-10-16 | Configure model registry sync + audit logging. |
| PayPal | FinOps | Coverage Gap – PayPal | 2025-10-16 | Add settlement webhook into revenue pipeline. |
| Gusto | People Ops | Coverage Gap – Gusto | 2025-10-18 | Provision SCIM + payroll alerts via Slack. |
| BambooHR | People Ops | Coverage Gap – BambooHR | 2025-10-18 | Mirror HR events into Workday/Okta flow. |
| Deel | People Ops | Coverage Gap – Deel | 2025-10-21 | Create contractor onboarding flow with WORM evidence. |

---

## CAB Packet & Ring Plan

*Change Description*: Deploy All Connections Orchestrator (ACO) to automate integration across the BlackRoad ecosystem with Linear-centric issue routing.

*Risk Assessment*: Medium—touches multiple systems and IdP; ensures idempotency and rollback via flow-level design.

*Testing Plan*:
1. Unit tests for each bot/flow.
2. Integration tests in staging environment using mocked endpoints.
3. End-to-end dry-run for critical flows (opp_to_task, stripe_paid_to_provision, hire_to_access).

*Rollback Strategy*: Disable affected flows, revert to previous configuration stored in Git; retain WORM evidence bundles.

*Ring Plan*:
1. **Canary**: Enable ACO for internal sandbox projects and non-critical Slack channels.
2. **Pilot**: Extend to selected teams (Implementation & GRC), monitoring SLOs and evidence.
3. **Broad**: Roll out to all teams and channels after two weeks of green metrics and CAB approval.

*Approval Route*: Submit CAB packet to Change Advisory Board; require sign-off from Engineering, Security, and Compliance leads before moving from Pilot to Broad.

---

This document seeds Linear, registers platform bots, defines flows, and maps coverage to ensure every `@codex` comment is tracked with audit-ready evidence.
