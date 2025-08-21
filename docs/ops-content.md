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
