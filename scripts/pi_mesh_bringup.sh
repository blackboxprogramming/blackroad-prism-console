#!/usr/bin/env bash
set -euo pipefail

# Packages to install for the distributed Pi workstation experience
PACKAGES=(barrier wayvnc tmux syncthing)

# Determine whether sudo is required
if [[ ${EUID} -ne 0 ]]; then
  if command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  else
    echo "This script must be run as root or with sudo available." >&2
    exit 1
  fi
else
  SUDO=""
fi

if ! command -v apt-get >/dev/null 2>&1; then
  echo "apt-get is required. This script targets Debian-based systems such as Raspberry Pi OS." >&2
  exit 1
fi

info() {
  printf '\n\033[1;34m[%s]\033[0m %s\n' "pi-mesh" "$1"
}

run_or_warn() {
  local description=$1
  shift
  if "$@"; then
    info "${description}: done"
  else
    printf '\033[1;33m[WARN]\033[0m %s failed; continuing.\n' "${description}" >&2
  fi
}

info "Updating package index"
${SUDO} apt-get update

info "Installing packages: ${PACKAGES[*]}"
${SUDO} apt-get install -y "${PACKAGES[@]}"

SYSTEMD_USER_DIR="${XDG_CONFIG_HOME:-${HOME}/.config}/systemd/user"
WAYVNC_SERVICE_PATH="${SYSTEMD_USER_DIR}/wayvnc.service"

info "Provisioning WayVNC systemd user service"
mkdir -p "${SYSTEMD_USER_DIR}"
cat > "${WAYVNC_SERVICE_PATH}" <<'SERVICE'
[Unit]
Description=WayVNC (Pi mesh bring-up)
After=graphical-session.target

[Service]
ExecStart=/usr/bin/wayvnc 0.0.0.0 5900
Restart=on-failure
Environment=PORTAL=1

[Install]
WantedBy=default.target
SERVICE

if command -v systemctl >/dev/null 2>&1; then
  run_or_warn "Reloading user systemd daemon" systemctl --user daemon-reload
  run_or_warn "Enabling WayVNC user service" systemctl --user enable --now wayvnc
  run_or_warn "Enabling Syncthing user service" systemctl --user enable --now syncthing
else
  printf '\033[1;33m[WARN]\033[0m systemctl not found; skip enabling WayVNC and Syncthing user services.\n'
fi

HOSTNAME=$(hostname)
info "Barrier is installed. Configure this Pi as a client pointed at your Barrier server's Tailscale name."

read -r -d '' TERMIUS <<'TERMIUS_ENTRIES'
Recommended Termius entries (Host, User, Port):

- Alice
  Host: alice
  User: pi
  Port: 22
  SSH over Tailscale: 100.x.y.z (replace with alice's tailnet IP)

- Lucidia
  Host: lucidia
  User: pi
  Port: 22
  SSH over Tailscale: 100.x.y.z (replace with lucidia's tailnet IP)

- Gamma
  Host: gamma
  User: pi
  Port: 22
  SSH over Tailscale: 100.x.y.z (replace with gamma's tailnet IP)
TERMIUS_ENTRIES

printf '\n%s\n' "${TERMIUS}"

info "Setup complete on host '${HOSTNAME}'. Launch Barrier (client mode) and connect to your server host."
info "WayVNC will listen on tcp://0.0.0.0:5900 across your mesh network."
info "Syncthing web UI: http://127.0.0.1:8384 (enable remote access as needed)."

