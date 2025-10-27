#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TARGET_DIR="/opt/blackroad"
SYSTEMD_DIR="/etc/systemd/system"
KIOSK_SERVICE="${SCRIPT_DIR}/kiosk/blackroad-kiosk.service"

info() { printf '\e[32m[INFO]\e[0m %s\n' "$*"; }
warn() { printf '\e[33m[WARN]\e[0m %s\n' "$*"; }
error() { printf '\e[31m[ERROR]\e[0m %s\n' "$*" 1>&2; }

require_64bit() {
  if ! uname -m | grep -qi 'aarch64'; then
    error "BlackRoad OS requires a 64-bit Raspberry Pi OS (ARM64/aarch64)."
    exit 1
  fi
}

install_packages() {
  info "Updating apt repositories"
  sudo apt-get update -y
  info "Installing base packages"
  sudo apt-get install -y ca-certificates curl jq git xz-utils unzip rsync
}

install_docker() {
  if command -v docker >/dev/null 2>&1; then
    info "Docker already installed"
    return
  fi

  info "Installing Docker Engine via convenience script"
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER" || true
  info "Docker Engine installed"
}

install_compose_plugin() {
  if docker compose version >/dev/null 2>&1; then
    info "Docker Compose plugin already available"
    return
  fi

  info "Installing Docker Compose plugin"
  ARCH="$(uname -m)"
  sudo mkdir -p /usr/libexec/docker/cli-plugins
  curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-${ARCH}" \
    | sudo tee /usr/libexec/docker/cli-plugins/docker-compose >/dev/null
  sudo chmod +x /usr/libexec/docker/cli-plugins/docker-compose
}

sync_repo() {
  info "Synchronising repository into ${TARGET_DIR}"
  sudo mkdir -p "${TARGET_DIR}"
  sudo rsync -a --delete --exclude='.git' --exclude='.github' "${REPO_ROOT}/" "${TARGET_DIR}/"
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

setup_kiosk_optional() {
  if [[ "${BR_KIOSK:-false}" != "true" ]]; then
    warn "Skipping kiosk dependencies (set BR_KIOSK=true to install)"
    return
  fi

  info "Installing kiosk dependencies"
  sudo apt-get install -y chromium-browser xserver-xorg xinit openbox unclutter
  if [[ -f "${KIOSK_SERVICE}" ]]; then
    sudo install -D -m 0644 "${KIOSK_SERVICE}" \
      "/etc/systemd/user/blackroad-kiosk.service"
  fi
  warn "Remember to configure autologin for the kiosk user. See os/kiosk/README.md."
}

print_next_steps() {
  cat <<NEXT

Installation complete.
Next steps:
  1. Copy the environment template: cd ${TARGET_DIR}/os/docker && cp .env.example .env
  2. Review secrets in .env (tokens, API keys).
  3. Enable and start the stack: sudo systemctl enable --now blackroad-compose.service
  4. Run diagnostics: brctl doctor

For kiosk mode instructions, review ${TARGET_DIR}/os/kiosk/README.md.
NEXT
}

main() {
  require_64bit
  install_packages
  install_docker
  install_compose_plugin
  sync_repo
  install_systemd_units
  install_cli
  setup_kiosk_optional
  print_next_steps
}

main "$@"
if ! uname -m | grep -qi 'aarch64'; then
  echo "ERROR: Use 64-bit Raspberry Pi OS (Bookworm) on Pi 4/5." >&2
  exit 1
fi

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
