# BlackRoad Hub & Products Execution Plan

## Domain Split Confirmation
- **blackroadinc.us** operates as **BlackRoad Hub** for operations and business functions, including SSO, policies, documentation, finance, HR, vendor management, and internal dashboards.
- **blackroad.io** operates as **BlackRoad** for all customer-facing product experiences, such as public marketing sites, product consoles, externally visible roadmaps, and the public status page.

This separation protects operational stability while allowing product delivery to iterate quickly without compromising controls.

## Blocked Execution Roadmap

### Block A — Identity, Communications, and Workboard (target: 60–90 minutes)
1. **Okta SSO**
   - Provision Okta tenant branded as BlackRoad Identity.
   - Integrate Slack, Asana (BlackRoad Tasks), GitHub (BlackRoad Code), Notion (BlackRoad Notes), and Jira (BlackRoad Issues).
   - Enforce MFA, SCIM where supported, and capture the configuration in the BlackRoad Vault.
2. **Slack Channels**
   - Seed the following channels: `#ops-standup`, `#ops-announcements`, `#ops-helpdesk`, `#ops-infra`, `#ops-sec`, `#ops-finance`, `#ops-hr`, `#ops-legal`, `#ops-data`, `#ops-marketing`, `#ops-design`, `#ops-product`, `#ops-sales`, `#ops-random`.
   - Pin "House Rules": 15‑minute daily stand-up, no secrets in chat (store in 1Password), CI must pass before merge, keep WIP low, Friday demo expectations.
   - Schedule daily stand-up in `#ops-standup` and weekly demo reminders for Fridays.
3. **Asana Workboard**
   - Create "BlackRoad Tasks – Ops" project and import the provided CSV to seed sections: Today, This Week, Backlog, Parking Lot.
   - Confirm `Friday Demo #1` is tracked with due date `2025-10-03` and dependencies on SSO/Slack/CI tasks.

### Block B — Repositories and CI Foundation (target: 90 minutes)
1. **Repository Setup**
   - Create GitHub repositories in `github.com/blackboxprogramming`: `br-platform-hub`, `br-products-site`, and verify `blackroad-prism-console` is present.
   - Apply branch protections on `main`: require PR reviews, status checks, and forbid force pushes.
   - Add `CODEOWNERS` assigning `amundsonalexa@gmail.com` as default reviewer.
2. **Ten-Minute CI Workflow**
   - Add `.github/workflows/ci.yml` that runs checkout, Node 20 setup, `npm ci`, lint, test, and build steps with a 10-minute timeout.
   - Enable Snyk scanning across repositories and enforce fail-on-high severity in CI.
   - Document weekly deployment cadence (Friday demos) and "never break the build" policy in repository README or contributing guide.

### Block C — Notion and Jira Foundations (target: 60 minutes)
1. **Notion Workspace**
   - Create workspace "BlackRoad Hub".
   - Add databases: Projects, Decisions (ADR), Risks, Vendors with the prescribed fields and relations.
   - Seed records using the reusable prompt with initiative context.
2. **Jira Projects**
   - Create projects: `HUB` (Kanban) for operations and `PROD` (Scrum) for product delivery.
   - Configure issue types (Epic, Story, Task, Bug), Fibonacci story points, and components per block guidance.
   - Establish ceremonies: daily stand-up, weekly Friday review/demo, WIP limit of 3 per assignee on HUB board.

### Block D — DNS and Domain Properties (target: 30–45 minutes)
1. **blackroadinc.us (Hub)**
   - Point apex to Hub hosting (A/ALIAS) and `www` CNAME to apex.
   - Create `dev.blackroadinc.us` (CNAME) targeting staging environment.
2. **blackroad.io (Products)**
   - Point apex to product hosting (A/ALIAS) with `www` CNAME to apex.
   - Create `status.blackroad.io` CNAME to status page provider, ensuring TLS coverage.

### Cross-Cutting Guardrails
- Provision "BlackRoad Vault" in 1Password for credentials; forbid secrets in repositories and Slack.
- Track lead time, deployment frequency, change fail rate, and MTTR in `#ops-monitor` once instrumentation is available.
- Use Planning Game sizing with weekly commitments; revisit risk levels (L1/L2/L3) at iteration boundaries.

## Reusable Giant Codex Prompt
Use the following prompt to generate Slack, Asana, Jira, GitHub, Notion, and DNS scaffolding for any initiative. Run it in a capable assistant/Codex session; replace the INPUT block with initiative-specific details.

````markdown
You are the BlackRoad Ops Orchestrator.

CONTEXT
- Company: BlackRoad.
- Domains: blackroadinc.us (Hub/ops), blackroad.io (Products).
- GitHub org: blackboxprogramming.
- Primary email for invites/ownership: amundsonalexa@gmail.com.
- Tool map (→ internal names):
  Project Mgmt: Asana→BlackRoad Tasks; Jira→BlackRoad Issues; Monday→BlackRoad Boards; Trello→BlackRoad Cards; ClickUp→BlackRoad Hub; Notion→BlackRoad Notes; Smartsheet→BlackRoad Sheets.
  CRM/Biz Ops: Salesforce→BlackRoad CRM; HubSpot→BlackRoad Leads; Airtable→BlackRoad Tables; Linear→BlackRoad Roadmap.
  Comms: Slack→BlackRoad Chat; Discord→BlackRoad Voice; Teams→BlackRoad Meet; Outlook→BlackRoad Mail; Telegram→BlackRoad Secure; Zoom→BlackRoad Video.
  Dev/Infra: GitHub→BlackRoad Code; GitLab→BlackRoad Lab; Docker→BlackRoad Containers; Replit→BlackRoad IDE; Postman→BlackRoad API; TestFlight→BlackRoad Beta; Apple Dev→BlackRoad iDev; App Store Connect→BlackRoad Store; VS Code→BlackRoad CodeX.
  Cloud/Hosting: Dropbox→BlackRoad Storage; DigitalOcean Droplets→BlackRoad Droplets; GoDaddy→BlackRoad Domains; AWS→BlackRoad Cloud; GCP→BlackRoad Platform; Azure→BlackRoad Azure; Kubernetes→BlackRoad Orchestrate; Terraform→BlackRoad IaC.
  Marketing: Google Ads→BlackRoad Ads; Instagram→BlackRoad Social; X/Twitter→BlackRoad Pulse.
  Design: Canva→BlackRoad Design; Figma→BlackRoad Proto; FigJam→BlackRoad Jam; Adobe Suite→BlackRoad Creative; Affinity→BlackRoad Affinity; Sketch→BlackRoad Sketch.
  Data & AI: Kaggle→BlackRoad Data; JupyterHub→BlackRoad Notebooks; Snowflake→BlackRoad Warehouse; BigQuery→BlackRoad Query.
  Finance: Stripe→BlackRoad Pay; PayPal→BlackRoad Wallet; QuickBooks→BlackRoad Books; NetSuite→BlackRoad ERP; Brex→BlackRoad Cards; Ramp→BlackRoad Spend; Wise→BlackRoad Global.
  HR: Workday→BlackRoad HR; Gusto→BlackRoad Payroll; BambooHR→BlackRoad People; Greenhouse→BlackRoad Recruit; Lever→BlackRoad Talent; LinkedIn Recruiter→BlackRoad Source.
  Security: Okta→BlackRoad Identity; Auth0→BlackRoad Auth; Splunk→BlackRoad Logs; Datadog→BlackRoad Monitor; Snyk→BlackRoad SecureCode; 1Password→BlackRoad Vault.
  Knowledge: Confluence→BlackRoad Wiki; Coursera/edX/Udemy/Khan→BlackRoad Learn/Basics/Academy/Courses.
  Hardware: Nvidia Jetson/Orin→BlackRoad AI; Raspberry Pi→BlackRoad Pi; Arduino→BlackRoad Maker; ROS→BlackRoad Robotics.

NAMING
- Repos/Projects: br-{area}-{name}, e.g., br-platform-hub, br-products-site, br-prism-console.
- Branches: main (protected), feat/{slug}, fix/{slug}.
- Envs: dev, staging, prod.

OUTPUTS (ALWAYS produce all if inputs are minimal)
1) SLACK_CHANNELS (list): #ops-standup, #ops-announcements, #ops-helpdesk, #ops-infra, #ops-sec, #ops-finance, #ops-hr, #ops-legal, #ops-data, #ops-marketing, #ops-design, #ops-product, #ops-sales, #ops-random.
2) ASANA_CSV (comma-separated): columns [Task Name, Description, Assignee Email, Section, Due Date].
3) JIRA_TICKETS (Markdown table): columns [Key*, Summary, Type, Points, Labels, Component].
4) GITHUB (shell): repo create commands, default labels, branch protection, CODEOWNERS, basic .github/workflows yaml.
5) NOTION_ROWS (Markdown): for databases [Projects, Decisions (ADR), Risks, Vendors].
6) DNS_TASKS: concrete records for blackroadinc.us (Hub) and blackroad.io (Products) incl. staging.

STYLE
- Short, unambiguous. No filler. Use today’s date for Due Date if absent. Use the provided email for Assignee by default.
- Assume weekly iteration with Friday demo; create a ‘Demo’ task.
- Prefer small, reversible steps; avoid big-bang. Keep builds under 10 minutes.

REQUEST
Given an INPUT of the form:
- initiative: <one-line>
- repos?: [..]
- owners?: [..emails..]
- due?: <date>
- notes?: <freeform>

…generate the six OUTPUTS above, prefilled for the initiative, following this context, naming, and cadence.

Why this shape: it bakes in small, reversible steps, fast builds, daily stand-ups, frequent demos, and clear artifacts—core agile mechanics that reduce risk and improve flow.
````

### Starter Input Example
```
initiative: Stand up BlackRoad Hub + Products baseline (SSO, Slack, Asana, CI)
repos?: [br-platform-hub, br-products-site, blackroad-prism-console]
owners?: [amundsonalexa@gmail.com]
due?: 2025-10-03
notes?: Route blackroadinc.us to Hub, blackroad.io to Products; weekly Friday demos; protect main branches; add 1Password vault + Snyk.
```

Feed the input block directly into the Orchestrator prompt to receive import-ready artifacts for Slack, Asana, Jira, GitHub, Notion, and DNS. Iterate on additional initiatives (e.g., security hardening, marketing sync) by swapping the INPUT values; the outputs remain consistently structured for rapid execution.

## Next Steps Checklist
- [ ] Execute Blocks A–D sequentially, logging progress in Asana.
- [ ] Run the Orchestrator prompt with the starter input to generate artifacts for immediate imports.
- [ ] Store generated files (CSV, Markdown) in a shared location under BlackRoad Hub for traceability.
- [ ] Schedule the first Friday demo to review SSO, Slack, CI readiness, and identify backlog adjustments.

Document version 1.0 — created to align the Hub/Product split, operational scaffolding, and reusable automation prompt for BlackRoad.

