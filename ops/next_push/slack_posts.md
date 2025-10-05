# Slack Posts

## #announcements — Kickoff (today)

Kicking off three tracks in parallel:
1) Security Baseline v1 (SSO, secrets, repo guardrails)
2) PRISM v0.1 Sprint Pack (6-week slice, weekly demos)
3) Marketing & Social Cadence v1 (calendar + assets flow)

Cadence: async stand-up by 10:00; demos Friday; retro biweekly.
Definition of Done Done = deployable, tested, documented, demo-ready.

## #security — Baseline plan

Security Baseline v1 (week 1):
- Okta org + MFA (Slack/Asana/Jira/GitHub/Notion)
- 1Password vaults by team; no secrets in code/chat
- Snyk + Dependabot on all repos; block high severity
- Branch protection + status checks (10-min CI)

Risks we'll watch: secrets sprawl, token hygiene, DNS misconfig.

## #products-prism — Sprint 0

PRISM v0.1 starts now. Sprint 0 focus:
- Repo hygiene + CI ≤10 min
- Auth & roles scaffold
- First data source path + schema
- /health, logs, OpenAPI

Friday demo: working auth stub + CI green + first endpoint.
Cadillac cutover: api.blackroad.io now has ACM cert + ALB + ECS Fargate + autoscaling + SSM secrets + GitHub OIDC deploys. Merge to main in br-api-gateway → auto rollout with zero downtime.

## #announcements — Status page launch

status.blackroad.io is live 🎉
- Hosted on S3+CloudFront with ACM cert
- Health checks wired to API
- Incidents flow via repo PRs or Asana
- Customers + team can see uptime and history in one place

## #products-prism — GitHub connector lands

GitHub connector lands (issues):
- Connect with PAT (read-only) + pick repos
- Ingest issues & labels; dbt models for daily openings + open bug count
- 2 new tiles wire to API

Webhook optional for near-real-time freshness.

## #security — GitHub secrets handling

GitHub PATs stored only as SSM SecureString refs; no plaintext DB storage.
Upgrade path to GitHub App is prepped; rotates tokens automatically.
