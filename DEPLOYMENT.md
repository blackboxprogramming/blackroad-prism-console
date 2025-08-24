# BlackRoad Deployment

## Environment

1. Copy `srv/blackroad-api/.env.example` to `.env` and fill secrets.
2. `INTERNAL_TOKEN` is used for privileged API calls.
3. `GITHUB_WEBHOOK_SECRET` verifies GitHub webhooks.

## GitHub App

1. Visit GitHub → Settings → Developer settings → GitHub Apps → New GitHub App.
2. Use `srv/blackroad-api/github_app_manifest.json` as a template.
3. Set webhook URL to `https://blackroad.io/api/webhooks/github` and secret to `GITHUB_WEBHOOK_SECRET`.
4. Install the app on repositories under `blackboxprogramming`.

## Fallback Webhook

If not using a GitHub App, create a classic webhook pointing to `/api/webhooks/github` with the same secret.

## Branch Policy

- `main` → production
- `staging` → staging

## Admin UI

Serve `var/www/blackroad/admin/index.html` and access it. Enter the internal token to use deployment actions.

## Backups

Nightly cron:
```
0 3 * * * /usr/local/bin/blackroad-backup-sqlite.sh
```
Backups stored under `/var/backups/blackroad/sqlite/`.

## Rollback

Use Admin UI or API `POST /api/rollback/:releaseId` with the internal token.

## Troubleshooting

- Ensure `/srv/blackroad-api` has required dependencies.
- Check `/var/log/blackroad-api/app.log` for server logs.
- Verify systemd unit `blackroad-api` is active.
