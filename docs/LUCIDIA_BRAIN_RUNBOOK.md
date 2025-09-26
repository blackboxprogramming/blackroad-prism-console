<!-- FILE: /srv/blackroad-api/docs/LUCIDIA_BRAIN_RUNBOOK.md -->
# Lucidia Brain v0.1 Runbook

## Environment Variables
- `ENABLE_LUCIDIA_BRAIN` (default `1`)
- `FLAG_ALLOW_FTS_FALLBACK` (`0` or `1`)
- `LUCIDIA_PSSHA_SEED` (optional override)
- `LUCIDIA_LLM_URL` (default `http://127.0.0.1:8000/api/llm/chat`)

## Database Migration
Apply migrations (auto-applied on server start) or manually:
```bash
sqlite3 /srv/blackroad-api/blackroad.db < db/migrations/20250824_lucidia_brain.sql
```

## Restart Service
```bash
systemctl restart blackroad-api
```

## Smoke Test
```bash
srv/blackroad-api/scripts/lbrain_smoketest.sh
```

## Rollback
- Set `ENABLE_LUCIDIA_BRAIN=0` in environment
- Restart service: `systemctl restart blackroad-api`
