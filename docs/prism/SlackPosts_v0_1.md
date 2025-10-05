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

## #products-prism — Source connector lands
```
Source connector lands:
- Connect flow (token) validates against Source X and stores secret in SSM
- API kicks off first ingest via ECS RunTask
- Sources page shows status + last sync
- dbt staging + fact models for rollups

We’ll demo connect→data→dashboard in one motion Friday.
```

## #security — Token handling
```
Tokens are never stored in DB; only SSM SecureString refs are. Rotate by overwriting the same param; revoke at provider any time.
```
