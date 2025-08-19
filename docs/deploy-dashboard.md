# BlackRoad.io — Ops & Content

## Rollbacks & Deploy Dashboard

- **Deploy to channel**:

```
/deploy blackroad canary
/deploy blackroad beta vercel
/deploy blackroad prod pages
```

- **Rollback** (to previous successful SHA recorded per channel):

```
/rollback blackroad canary
/rollback blackroad prod 2 pages   # go back two entries, deploy on Pages
```

- The site shows **Deploy History** at `/deploys` (reads `/deploys.json` committed by the deploy workflow).

> If anything fails:
> `/codex apply .github/prompts/codex-fix-anything.md`

How to use (quick)

- Deploy a canary:

```
/deploy blackroad canary
```

- Roll back prod to the previous recorded SHA:

```
/rollback blackroad prod
```

- View history in the UI: go to /deploys.

This gives you recorded deploy history, one-command rollbacks, and a dashboard page—all skip-safe and self-healing with your existing “Fix Anything” bot.
