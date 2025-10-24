#!/usr/bin/env bash
# mesh_workstation_bringup.sh
#
# Automates the Raspberry Pi "many-windows" workstation setup described in the
# fast-path recipe. Installs Barrier, WayVNC, tmux, and Syncthing, creates a
# user-level WayVNC service, and prints ready-to-use Termius connection entries.

set -euo pipefail

SCRIPT_NAME="$(basename "$0")"

BARRIER_ROLE="client"
VNC_PORT="5900"
SSH_USER="pi"
APT_UPDATE_RAN=false

# shellcheck disable=SC2034 # referenced dynamically during printing
NODE_ORDER=(alice lucidia gamma)
declare -A NODE_IPS=()

print_usage() {
  cat <<USAGE
Usage: $SCRIPT_NAME [options]

Options:
  --barrier-role <client|server>  Desired Barrier role on this host (default: client).
  --vnc-port <port>               TCP port WayVNC should listen on (default: 5900).
  --ssh-user <user>               SSH username for Termius entries (default: pi).
  --node <name[=ip]>              Record a node for the Termius summary. Repeat for alice,
                                 lucidia, and gamma. If the IP is omitted, the hostname is used.
  --skip-termius                  Do not print Termius connection templates.
  -h, --help                      Show this help message and exit.

Examples:
  $SCRIPT_NAME --barrier-role server --node alice=100.66.58.5 --node lucidia=100.100.10.10 \\
               --node gamma --ssh-user ubuntu

  $SCRIPT_NAME --node alice --node lucidia --node gamma
USAGE
}

log() {
  printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$1"
}

die() {
  echo "Error: $1" >&2
  exit 1
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    die "Required command '$1' not found in PATH"
  fi
}

run_apt() {
  local sudo_cmd
  if [[ $EUID -eq 0 ]]; then
    sudo_cmd=()
  else
    sudo_cmd=(sudo)
  fi
  "${sudo_cmd[@]}" "$@"
}

maybe_update_apt_cache() {
  if [[ $APT_UPDATE_RAN == false ]]; then
    log "Updating apt package index (sudo password may be required)..."
    run_apt apt-get update
    APT_UPDATE_RAN=true
  fi
}

install_packages() {
  log "Ensuring Barrier, WayVNC, tmux, and Syncthing are installed..."
  maybe_update_apt_cache
  run_apt apt-get install -y barrier wayvnc tmux syncthing
}

setup_wayvnc_service() {
  local systemd_user_dir="$HOME/.config/systemd/user"
  local service_path="$systemd_user_dir/wayvnc.service"

  mkdir -p "$systemd_user_dir"

  cat >"$service_path" <<SERVICE
[Unit]
Description=WayVNC
After=graphical-session.target

[Service]
ExecStart=/usr/bin/wayvnc 0.0.0.0 ${VNC_PORT}
Restart=on-failure
Environment=PORTAL=1

[Install]
WantedBy=default.target
SERVICE

  log "Created WayVNC user service at $service_path"

  if command -v systemctl >/dev/null 2>&1; then
    log "Reloading user systemd units and enabling WayVNC..."
    if systemctl --user daemon-reload && systemctl --user enable --now wayvnc.service; then
      log "WayVNC user service enabled and started."
    else
      log "systemctl --user commands failed; start WayVNC manually with 'systemctl --user start wayvnc.service' after logging into a graphical session."
    fi
  else
    log "systemctl not found; please enable the WayVNC service manually."
  fi
}

print_barrier_summary() {
  cat <<SUMMARY
Barrier setup next steps:
  • Launch Barrier and select the "$BARRIER_ROLE" role on this host.
  • For clients, connect to the Barrier server using its Tailscale hostname (e.g., alice).
  • For the main workstation, arrange screen positions in the Barrier UI.
SUMMARY
}

print_termius_entries() {
  [[ ${SKIP_TERMIUS:-false} == true ]] && return

  echo ""
  echo "Termius quick-add entries:"
  for node in "${NODE_ORDER[@]}"; do
    local hostname
    if [[ -n ${NODE_IPS[$node]+_} && -n ${NODE_IPS[$node]} ]]; then
      hostname=${NODE_IPS[$node]}
    else
      hostname=$node
    fi
    cat <<ENTRY
Host: $node
  Hostname: $hostname
  User: $SSH_USER
  Port: 22
ENTRY
  done
}

parse_args() {
  SKIP_TERMIUS=false

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --barrier-role)
        [[ $# -lt 2 ]] && die "--barrier-role requires an argument"
        BARRIER_ROLE="$2"
        shift 2
        ;;
      --vnc-port)
        [[ $# -lt 2 ]] && die "--vnc-port requires a port number"
        VNC_PORT="$2"
        shift 2
        ;;
      --ssh-user)
        [[ $# -lt 2 ]] && die "--ssh-user requires a username"
        SSH_USER="$2"
        shift 2
        ;;
      --node)
        [[ $# -lt 2 ]] && die "--node requires an argument"
        local node_spec="$2"
        shift 2
        if [[ $node_spec == *=* ]]; then
          local name="${node_spec%%=*}"
          local value="${node_spec#*=}"
          NODE_IPS["$name"]="$value"
        else
          NODE_IPS["$node_spec"]=""
        fi
        ;;
      --skip-termius)
        SKIP_TERMIUS=true
        shift
        ;;
      -h|--help)
        print_usage
        exit 0
        ;;
      *)
        die "Unknown option: $1"
        ;;
    esac
  done

  if [[ $BARRIER_ROLE != "client" && $BARRIER_ROLE != "server" ]]; then
    die "--barrier-role must be either 'client' or 'server'"
  fi

  if ! [[ $VNC_PORT =~ ^[0-9]+$ ]]; then
    die "--vnc-port must be a numeric value"
  fi
}

main() {
  parse_args "$@"

  require_command apt-get

  install_packages
  setup_wayvnc_service

  log "Installed packages and configured WayVNC."
  print_barrier_summary
  print_termius_entries
}

main "$@"
