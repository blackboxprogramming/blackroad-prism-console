# Troubleshooting BlackRoad OS

## Services do not start
- Run `/opt/blackroad/os/brctl doctor` to verify Docker and compose health.
- Use `/opt/blackroad/os/brctl logs <service>` for detailed logs.

## Healthcheck failures
- Confirm the underlying application exposes a `/health` endpoint.
- Temporarily disable the failing service's healthcheck in `docker-compose.yml` to isolate startup issues.

## Kiosk does not launch
- Ensure lingering is enabled for the kiosk user: `loginctl enable-linger <user>`.
- Use `systemctl --user status blackroad-kiosk.service` to inspect failures.

## Removing installation
- Execute `os/uninstall.sh` to stop services and remove systemd units.
