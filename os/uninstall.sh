#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="/opt/blackroad"
COMPOSE_SERVICE="blackroad-compose.service"
PURGE=false

usage() {
  cat <<USAGE
Usage: uninstall.sh [--purge]

Removes BlackRoad OS systemd units, Docker stack, and optionally data volumes.
  --purge   Remove persistent Docker volumes (irreversible)
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --purge)
      PURGE=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if systemctl list-unit-files | grep -q "${COMPOSE_SERVICE}"; then
  sudo systemctl disable --now "${COMPOSE_SERVICE}" || true
fi

if [[ -x /usr/local/bin/brctl ]]; then
  /usr/local/bin/brctl down || true
fi

if docker compose -f "${TARGET_DIR}/os/docker/docker-compose.yml" ps >/dev/null 2>&1; then
  (cd "${TARGET_DIR}/os/docker" && docker compose down ${PURGE:+-v}) || true
fi

sudo rm -f "/etc/systemd/system/${COMPOSE_SERVICE}"
sudo rm -f "/etc/systemd/system/blackroad.target"
sudo systemctl daemon-reload

sudo rm -f /usr/local/bin/brctl

if [[ "${PURGE}" == true ]]; then
  echo "Purging named Docker volumes"
  docker volume prune -f
fi

echo "BlackRoad OS components removed. Application data in ${TARGET_DIR} retained."
