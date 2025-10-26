# Observability (Grafana + Loki + Promtail)

## Access
- Grafana: `http://<pi-ip>/grafana` (default admin/admin — change in `.env`)
- Loki is internal; Grafana uses it via the provisioned datasource.

## What you get
- Container logs for every service, labeled by `{stack,service,container,stream}`.
- Filter errors: `{job="docker-logs"} |= "ERROR"`
- Focus one service: `{service="blackroad-api"}`

## Dashboards
- Import community dashboards (e.g., ID **15158** "Docker Logs").
- Place JSON under `os/docker/obsv/grafana/dashboards/` → auto-loaded at startup.

## Tips
- Retention is 7d by default in `loki-config.yml` (tune for SD wear).
- All apps should log to stdout; Promtail scrapes Docker logs automatically.
