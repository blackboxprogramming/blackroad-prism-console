# BlackRoad Self-Healing Agent

This directory contains lightweight Bash tooling that keeps the production
services in `/srv/blackroad` healthy.  It mirrors all tracked GitHub repositories,
checks for drift and service health, and automatically rolls deployments back to
known-good commits when repeated failures occur.

## Components

- `mirror_sync.sh` — maintains bare mirrors under `/srv/blackroad/mirror` and
  working copies under `/srv/blackroad/work` for each tracked repository.
- `health_check.sh` — runs the drift, process, port, and environment checks and
  triggers healing actions.
- `rollback.sh` — pins services to commits listed in
  `state/known_good.txt` after repeated failures.
- `logs/` — contains streaming logs produced by the scripts.
- `state/` — stores counters, environment hashes, and the known-good manifest.

The accompanying systemd units live in `../../../../systemd/`:

- `blackroad-mirror.service` / `.timer`
- `blackroad-health.service` / `.timer`

## Usage

1. Copy the scripts to `/srv/blackroad/health` on the droplet.
2. Ensure the `REPOS` list in `mirror_sync.sh` and the `WATCH` array in
   `health_check.sh` reflect all deployed services.
3. Provide `state/known_good.txt` entries in the form `repo commit service` for
   the rollback script.
4. Install the systemd units and enable the timers:

   ```bash
   sudo cp systemd/blackroad-*.service systemd/blackroad-*.timer /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now blackroad-mirror.timer blackroad-health.timer
   ```

Logs will accumulate in `/srv/blackroad/health/logs`, and notable events are
also appended to `events.log` for external notification tooling.
