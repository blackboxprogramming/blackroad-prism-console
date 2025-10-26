# BlackRoad OS for Raspberry Pi

BlackRoad OS converts a Raspberry Pi 4/5 (64-bit) into an appliance that boots the entire BlackRoad platform automatically. This directory contains the installer, runtime stack, systemd units, CLI tooling, and operational documentation required to deploy and maintain the stack.

## Quick Start (10 minutes)

1. **Flash the Pi** with the latest Raspberry Pi OS Bookworm (64-bit) and connect it to the network.
2. **Clone the repository** (or copy the `os/` folder) onto the device.
3. **Run the installer**:
   ```bash
   cd blackroad-prism-console/os
   ./install.sh
   ```
4. **Populate configuration**:
   ```bash
   cd /opt/blackroad/os/docker
   cp .env.example .env
   # edit .env with secrets, tokens, and site-specific settings
   ```
5. **Launch the stack**:
   ```bash
   sudo systemctl enable --now blackroad-compose.service
   ```
6. **Verify**:
   ```bash
   brctl doctor
   brctl health
   ```
7. **Access** the UI at `http://pi.local/` (or the Pi's IP address).

## Folder Layout

```
os/
├── brctl                     # Primary management CLI
├── docker/                   # Compose stack, env templates, Docker build contexts
├── docs/                     # Architecture and troubleshooting docs
├── install.sh                # Installer for fresh Raspberry Pi
├── kiosk/                    # Optional kiosk mode systemd unit and docs
├── systemd/                  # Systemd units for Compose supervisor
├── tests/                    # Smoke tests for health verification
└── uninstall.sh              # Removal script
```

## Lifecycle

- **Upgrades**: Pull the latest repository, rerun `install.sh` to refresh systemd units/CLI, then run `brctl upgrade`.
- **Status checks**: Use `brctl status`, `brctl ps`, and `journalctl -u blackroad-compose`.
- **Troubleshooting**: Refer to [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) for log locations and recovery steps.

## Upgrades

See [`docs/UPGRADES.md`](docs/UPGRADES.md) for the OTA workflow, release channels, health checks, and rollback procedures.

## Requirements

- Raspberry Pi 4 or 5 with at least 4GB RAM.
- Raspberry Pi OS (Bookworm) 64-bit.
- 32GB+ microSD or SSD is recommended for Docker images and data volumes.
- Internet access during installation for package and container downloads.

## Data persistence

Persistent data volumes are defined in `docker/docker-compose.yml` (e.g., Mosquitto, Redis). Application-specific data should mount host directories or named volumes as needed.

## Kiosk Mode

The optional kiosk mode launches Chromium pointing at the local UI using a systemd **user** service. Installation of kiosk dependencies is disabled by default; set `BR_KIOSK=true` before running `install.sh` to enable kiosk prerequisites. Detailed steps are documented in [`kiosk/README.md`](kiosk/README.md).

## Uninstall

Run `os/uninstall.sh` to remove systemd units and Docker resources. Pass `--purge` to delete persistent volumes (irreversible). See [`uninstall.sh`](uninstall.sh) for details.

## Support & Contributions

Please file issues and PRs via the repository workflow. Contributions should maintain idempotency, avoid embedding secrets, and respect ARM64 constraints.
