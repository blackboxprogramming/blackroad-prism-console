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

## Realtime Collaboration Service (Yjs)

The `yjs-websocket.service` unit runs from `/srv/yjs-server` and requires the
`y-websocket` package to be installed locally. After deploying the
`srv/yjs-server` directory to the host, install the dependencies before
starting or restarting the service:

```
cd /srv/yjs-server
npm install --omit=dev
systemctl restart yjs-websocket.service
```

The `ExecStart` command uses the bundled
`node_modules/y-websocket/bin/server.js`, so the install step must succeed for
`systemctl start yjs-websocket.service` to work.

## Monitoring and Observability

The Kubernetes manifest at `deploy/k8s/monitoring.yaml` provisions a full
monitoring stack in the `prism-monitoring` namespace.

- **Prometheus** scrapes `blackroad-api`, `lucidia-llm`, `lucidia-math`, and the
  NGINX ingress metrics endpoint with retention set to 15 days.
- **Grafana** persists dashboards and preloads panels for API latency, LLM
  response times, math contradictions, and system resource usage. Grafana is
  exposed at `/monitoring` via NGINX ingress and secured with basic auth.
- **Loki** and **Promtail** collect pod logs so dashboards can query centralized
  logs.
- **Alertmanager** notifies configured Slack or Discord webhooks when services
  go down, 5xx errors spike, database writes fail, or more than 10 contradictions
  occur within 10 minutes.

Apply the manifest with `kubectl apply -f deploy/k8s/monitoring.yaml` to enable
observability for the Prism stack.
