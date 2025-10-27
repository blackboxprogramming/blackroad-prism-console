#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TARGET_DIR="/opt/blackroad"
SYSTEMD_DIR="/etc/systemd/system"

info() { printf '\e[32m[INFO]\e[0m %s\n' "$*"; }
warn() { printf '\e[33m[WARN]\e[0m %s\n' "$*"; }
error() { printf '\e[31m[ERROR]\e[0m %s\n' "$*" 1>&2; }

require_64bit() {
  if ! uname -m | grep -qi 'aarch64'; then
    error "BlackRoad OS requires 64-bit Raspberry Pi OS (ARM64/aarch64)."
    exit 1
  fi
}

install_packages() {
  info "Updating apt repositories"
  sudo apt-get update
  info "Installing base packages"
  sudo apt-get install -y ca-certificates curl git jq xz-utils \\
    chromium-browser xserver-xorg xinit openbox unclutter || true
}

install_docker() {
  if command -v docker >/dev/null 2>&1; then
    info "Docker already installed"
    return
  fi

  info "Installing Docker Engine via convenience script"
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER" || true
}

sync_repo() {
  info "Synchronising repository into ${TARGET_DIR}"
  sudo mkdir -p "${TARGET_DIR}"
  sudo rsync -a --exclude '.git' --exclude '.github' "${REPO_ROOT}/" "${TARGET_DIR}/"
  sudo chown -R "$USER":"$USER" "${TARGET_DIR}"
}

install_systemd_units() {
  info "Installing systemd units"
  sudo install -m 0644 "${TARGET_DIR}/os/systemd/blackroad-compose.service" "${SYSTEMD_DIR}/blackroad-compose.service"
  sudo install -m 0644 "${TARGET_DIR}/os/systemd/blackroad.target" "${SYSTEMD_DIR}/blackroad.target"
  sudo systemctl daemon-reload
}

install_cli() {
  info "Installing brctl CLI"
  sudo install -m 0755 "${TARGET_DIR}/os/brctl" "/usr/local/bin/brctl"
}

print_next_steps() {
  cat <<NEXT
-----
BlackRoad OS installed to /opt/blackroad
Next steps:
  cd /opt/blackroad/os/docker && cp .env.example .env
  sudo systemctl enable --now blackroad-compose.service
  /opt/blackroad/os/brctl doctor
NEXT
}

main() {
  require_64bit
  install_packages
  install_docker
  sync_repo
  install_systemd_units
  install_cli
  print_next_steps
}

main "$@"
