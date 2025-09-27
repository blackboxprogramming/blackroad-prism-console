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
