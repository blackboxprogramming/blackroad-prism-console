# PRISM v0.1 — Slack Copy

## #products-prism — Sprint Kickoff
```
PRISM v0.1 in motion:
- Scope: Auth + 3-step onboarding + first Source X + 2 dashboard tiles (events/errors)
- API endpoints under /v1 ready to implement
- Jira sprint seeded; demo Friday

Definition of Done Done: deployable, CI green ≤10m, docs updated, demoable with seeded data.
```

## #announcements — Friday Demo
```
Friday demo: PRISM v0.1 slice
- Magic-link auth
- Connect first source
- 2 live tiles with last 7d
- Minimal audit trail & tracking
Timeboxed to 10 min — bring one question: “What’s the next tile that makes this indispensable?”
```

## #products-prism — GitHub connector live
```
GitHub connector is live end-to-end:
- PAT connect + repo list
- Ingest worker (watermark + rate limits)
- Metrics API for opened/closed/open bugs
- Tiles wired; visible on dashboard + /healthz/ui
```

## #security — GitHub PAT handling
```
PATs never hit the DB; SSM SecureString only. Rotate by overwriting the SSM param.
```
