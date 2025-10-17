# BlackRoad Ops Day-One Implementation Guide

This playbook captures the immediate decisions, setup actions, and reusable automation prompts for aligning the BlackRoad operating environment. Use it as the source of truth while the core tooling, domains, and cadences are established.

## 1. Foundation Decisions (Lock Today)

### Core Systems (single source of truth)
- **Work management**: Asana for Operations/Business, Jira for Product/Engineering.
- **Documentation**: Notion ("BlackRoad Hub" as the home page).
- **Communications**: Slack primary, Discord optional for community.
- **Code**: GitHub organization `blackboxprogramming` with repositories prefixed `blackroad-*`.
- **Identity & secrets**: Okta for SSO, 1Password for vaults.
- **CRM & revenue**: HubSpot initially, plan to shift to Salesforce as pipeline scales.
- **Data**: Airtable for operational database, Snowflake as the future warehouse.
- **Design**: Figma & FigJam.
- **Monitoring & security**: Datadog and Snyk.

### Domain Routing
- **blackroad.io** → public marketing site and customer-facing products.
  - `www.blackroad.io` (marketing)
  - `app.blackroad.io` (customer app)
  - `api.blackroad.io` (public API)
  - `status.blackroad.io` (Statuspage)
- **blackroadinc.us** → internal operations footprint.
  - `hub.blackroadinc.us` (Notion)
  - `id.blackroadinc.us` (Okta)
  - `ops.blackroadinc.us` (internal portal)
  - `data.blackroadinc.us` (business intelligence)

### Naming Normalization
Standardize external vendor names to "BlackRoad <Capability>" (e.g., "BlackRoad Tasks" for Asana, "BlackRoad Leads" for HubSpot, "BlackRoad Chat" for Slack) to keep integrations and documentation consistent.

## 2. Today’s Ops Push (90–120 minutes)

### Slack
- Create channels: `#announcements`, `#ops`, `#eng`, `#product`, `#marketing`, `#sales`, `#people`, `#security`, `#helpdesk`, `#intros`, `#random`.
- Pin the decision log, sprint cadence, incident process, and quick links to Asana, Jira, and Notion.
- Install Slack apps for Asana and Jira to enable two-way task syncing.

### Notion — "BlackRoad Hub"
- Top-level navigation: Company, Operating System, Product, GTM, People, Security, Runbooks.
- Templates: PRD, RFC, Architecture Decision Record, Post-mortem, Weekly Executive Brief.

### Asana (Ops)
- Projects: HQ Ops, RevOps, Finance, People Ops, Legal & Security.
- Sections: Inbox → Planned → In Progress → Review → Done.
- Fields: Priority (P0–P3), Owner, Due Date, Effort (S/M/L).
- Seed "Today’s Push" tasks (see checklist below).

### Jira (Engineering/Product)
- Project: **BR-Core** (team-managed, scrum, 1-week sprints).
- Board columns: Backlog → Ready → In Progress → Code Review → QA → Done.
- Definition of Done: merged, tests pass, CI green, docs updated, staged or deployed as agreed.
- Enable GitHub Actions build status and Snyk checks on pull requests.

### GitHub
- Repositories to (ensure) exist: `blackroad-www`, `blackroad-app`, `blackroad-api`, `blackroad-ops-portal`, `blackroad-prism-console`, `blackroad-infra`, `blackroad-bots`.
- Branch protection: require reviews, status checks, and linear history.
- Actions: CI (build/lint/test), CD to staging, Snyk scanning, Dependabot updates.

### Identity & Secrets
- Okta: groups All, Ops, Eng, Product, Security; enforce SSO to Slack, GitHub, Asana, Jira, Notion.
- 1Password: vaults for Engineering, Ops, Finance, Marketing, Security.

### Cadence
- Daily stand-up (15 min, Slack huddle acceptable): what changed, what’s next, blockers.
- Weekly demo (30 min): showcase working software and confirm delivered value.
- Weekly retro (25 min): pick 1–2 improvements, assign owners, track follow-through.
- Target a ten-minute CI build; automate and run it often.

### Copy/Paste Checklist for Asana/Jira
- Stand up Slack channels, pins, and Slack-Asana/Jira apps.
- Create Notion hub with templates.
- Configure Asana projects, sections, fields, and seed tasks.
- Configure Jira BR-Core (weekly sprints, DoD, first sprint).
- Apply GitHub org policies, create repos, enable Actions, Snyk, Dependabot, CODEOWNERS.
- Wire Okta SSO (Slack, Asana, Jira, GitHub, Notion) and enforce MFA.
- Establish 1Password vaults and shared secret policy; ensure `.env.example` files exist.
- Provision DNS subdomains (`app`, `api`, `status`, `hub`, `id`, `ops`, `data`).
- Schedule daily stand-up (9:00) and Friday demo/retro (14:00).

## 3. Operating Rhythm, Risks, and Metrics

### Sprint Rhythm
- One-week sprints: plan Monday, demo and retro Friday.
- Maintain backlog hygiene: slice stories thin, estimate consistently, include slack capacity.
- Adopt a "no bugs" mindset: prevent, eliminate breeding grounds, fix now, and fix the process.

### Risk-Tiered Project Levels
- **Level 1** (high risk): full charter, risk analysis, stage-gate reviews, permanent records.
- **Level 2**: lighter documentation with reviews at key gates.
- **Level 3**: lean documentation with focus on closeout notes.

### Performance Lenses & Example Metrics
- **Quality**: defect escape rate, incident recurrence.
- **Speed**: lead time, cycle time, ten-minute build adherence.
- **Dependability**: on-time release rate, change failure rate.
- **Flexibility**: percentage of scope changes absorbed within sprint.
- **Cost**: unit economics, cloud cost per weekly active user.

### Agile Guardrails
- Embrace changing requirements while grounding changes in the backlog.
- Ship working increments frequently with small, empowered teams.
- Prefer live communication for clarification; reflect and tune at every retro.

## 4. Codex Prompt Kit (Reusable Automation)

Use the prompts below with the "BlackRoad Codex" master system prompt (TypeScript, Next.js 14, Node 20+, Prisma/Postgres, Docker, GitHub Actions, Terraform on AWS). Each prompt block includes inputs and required outputs so multiple scaffolds can be generated in parallel.

1. **Repo Scaffolder** — generate Next.js/Fastify/worker/lib repos with CI, Docker, Prisma, README, ADR.
2. **CI/CD Pipelines** — add GitHub Actions for install/lint/test, build, release, Snyk; include README badges.
3. **Terraform Baseline (AWS)** — modules for VPC, RDS, ElastiCache, ECR, ECS/EKS, SSM; backend state, IAM, Makefile.
4. **Okta SSO + 1Password** — runbook for app integrations, SCIM, group model, vault layout, CLI usage.
5. **Slack Bot (Asana/Jira Bridge)** — Bolt.js bot with slash commands, webhooks, tests, README.
6. **Marketing Site** — Next.js marketing scaffold with MDX, blog, SEO, analytics, deploy script.
7. **Ops Portal** — authenticated Next.js portal embedding Notion, Datadog, Asana, Jira with RBAC stubs.
8. **Public API Gateway** — Fastify API with OpenAPI, Swagger UI, API keys, per-key rate limiting, Postman collection.
9. **Data Hub** — nightly Airtable → Postgres sync worker with schema mapping and data quality checks.
10. **Snowflake Warehouse** — Terraform/SQL + dbt skeleton for warehouse/db/roles with CI.
11. **Security Baseline** — Snyk, Dependabot, secret scanning, CODEOWNERS, PR templates, SECURITY.md.
12. **Kubernetes Manifests** — Helm chart, Deployment, Service, HPA, Ingress, ConfigMap/Secrets, ArgoCD spec.
13. **Release Notes Generator** — conventional commits to release notes (Release Please or Changesets).
14. **Analytics + Events** — event schema, TS SDK (track/identify/page), dashboards.
15. **Testing Harness** — Vitest + Playwright setup per repo type with CI integration.
16. **GitHub Org Guardrails** — Terraform/GH CLI scripts enforcing branch protection, signed commits, status checks.
17. **Post-mortem Template + Bot** — Slack `/postmortem` command generating Notion template, assigning owners.
18. **Social Ops** — queue-based Instagram/X poster with audit log, rate limiting, media handling.
19. **PRD + RFC Generators** — templater to scaffold docs from prompts (Markdown/Notion export).
20. **Roadmap Pack** — auto-create epics/stories/tasks in Linear or Jira from a high-level brief.

## 5. Next Steps
- Paste the "Today’s Ops Push" checklist into Asana (HQ Ops) and Jira (BR-Core) as initial tasks.
- Stand up the GitHub repositories and apply guardrails immediately after enabling Okta SSO and 1Password vaults.
- Use the Codex Prompt Kit to bootstrap core services (marketing site, ops portal, API gateway) concurrently once access is in place.

Maintain this document as the live reference for day-one execution; update sections as tooling or cadences evolve.
