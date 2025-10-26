# BlackRoad OS Architecture

BlackRoad OS provides a Raspberry Pi focused deployment for the Prism Console. The system is composed of:

- **Installer (`install.sh`)** – stages the repository under `/opt/blackroad`, installs docker and desktop kiosk dependencies, and registers systemd units.
- **Systemd target/service** – boots a docker-compose stack via `blackroad-compose.service` and `blackroad.target`.
- **Docker compose stack** – Traefik reverse proxy fronting application containers for APIs, web UI, and supporting services.
- **Control CLI (`brctl`)** – convenience wrapper for lifecycle operations, health checks, and kiosk controls.
- **Kiosk unit (optional)** – launches Chromium in kiosk mode pointed at the local web UI.

See `os/docs/TROUBLESHOOTING.md` for operational guidance.
