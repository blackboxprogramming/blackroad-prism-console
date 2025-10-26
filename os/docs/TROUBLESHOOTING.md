# Troubleshooting BlackRoad OS

## Quick checks

1. **Stack status**
   ```bash
   brctl status
   docker compose -f /opt/blackroad/os/docker/docker-compose.yml ps
   ```
2. **Systemd logs**
   ```bash
   sudo journalctl -u blackroad-compose.service -f
   ```
3. **Container logs**
   ```bash
   brctl logs <service>
   ```

## Common issues

### Missing `.env`
If services fail to start with missing environment variables, ensure `.env` exists:
```bash
cd /opt/blackroad/os/docker
cp .env.example .env
```
Populate secrets such as `DISCORD_BOT_TOKEN`, `BR_API_KEY`, etc.

### Ports already in use
Traefik requires port 80 (and optionally 443). Use `sudo lsof -i :80` or `sudo ss -tulpn | grep ':80'` to locate conflicting services. Disable Apache/NGINX if running.

### Docker not installed / permission denied
After running `install.sh`, log out and log back in to apply Docker group membership. Verify with `docker ps`.

### Health checks failing
Run the smoke test to capture failing endpoints:
```bash
/opt/blackroad/os/tests/smoke.sh
```
Investigate the failing container via `brctl logs <service>`.

### MQTT connection errors
Ensure the `mqtt` service is running (`docker ps`). Confirm `MQTT_URL` in `.env` matches `mqtt://mqtt:1883`. Restart the service: `docker compose restart pi-ops`.

### Updating services
1. Pull latest repository changes.
2. Rerun `os/install.sh` to refresh CLI/systemd units.
3. Execute `brctl upgrade` to pull images and redeploy.

### Removing the stack
Use `os/uninstall.sh` to cleanly remove systemd units and containers. Add `--purge` to delete Docker volumes if you want a clean slate.

## Getting help

- Review `os/docs/ARCHITECTURE.md` for component relationships.
- File issues with logs, hardware details, and steps to reproduce in the repository issue tracker.
