#!/usr/bin/env bash
# Configure the Pi 400 admin console with shortcuts, tooling, and SSH keys.
set -euo pipefail

log() { printf '\n[pi-400] %s\n' "$*"; }
warn() { printf '[pi-400] WARN: %s\n' "$*" >&2; }

PI_USER=${PI_USER:-pi}
PI_OPS_HOST=${PI_OPS_HOST:-pi-ops.local}
PI_HOLO_HOST=${PI_HOLO_HOST:-pi-holo.local}
PI_SIM_HOST=${PI_SIM_HOST:-pi-sim.local}
MQTT_HOST=${MQTT_HOST:-$PI_OPS_HOST}
SSH_DIR="${HOME}/.ssh"
SSH_KEY_PATH="${SSH_DIR}/id_ed25519"
SSH_CONFIG="${SSH_DIR}/config"
ALIAS_FILE="${HOME}/.bash_aliases"
BIN_DIR="${HOME}/bin"

PACKAGES=(git jq tmux mosquitto-clients rsync python3-pip python3-venv)

update_block() {
  local file="$1" marker="$2" content="$3"
  local start="# >>> ${marker} >>>"
  local end="# <<< ${marker} <<<"
  python3 - "$file" "$start" "$end" 3<<<"$content" <<'PY'
import os
import sys
from pathlib import Path

path = Path(sys.argv[1])
start = sys.argv[2]
end = sys.argv[3]
with os.fdopen(3) as block_fd:
    body = block_fd.read().rstrip("\n")
block = f"{start}\n{body}\n{end}\n"
if path.exists():
    text = path.read_text()
else:
    text = ""
if start in text and end in text:
    before, rest = text.split(start, 1)
    _, after = rest.split(end, 1)
    new_text = before.rstrip("\n") + "\n" + block + after.lstrip("\n")
else:
    if text and not text.endswith("\n"):
        text += "\n"
    new_text = text + block
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text(new_text)
PY
}

log "Installing base packages (${PACKAGES[*]})"
sudo apt-get update
sudo apt-get install -y "${PACKAGES[@]}"

log "Ensuring SSH key (${SSH_KEY_PATH})"
mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"
if [[ ! -f "${SSH_KEY_PATH}" ]]; then
  ssh-keygen -t ed25519 -N "" -f "$SSH_KEY_PATH"
else
  log "SSH key already exists; skipping generation"
fi
chmod 600 "$SSH_KEY_PATH" "${SSH_KEY_PATH}.pub"

log "Configuring SSH host shortcuts"
ssh_block=$(cat <<EOSSH
Host pi-ops
    HostName ${PI_OPS_HOST}
    User ${PI_USER}
    PreferredAuthentications publickey
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
    ForwardAgent yes

Host pi-holo
    HostName ${PI_HOLO_HOST}
    User ${PI_USER}
    PreferredAuthentications publickey
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
    ForwardAgent yes

Host pi-sim
    HostName ${PI_SIM_HOST}
    User ${PI_USER}
    PreferredAuthentications publickey
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
    ForwardAgent yes
EOSSH
)
update_block "$SSH_CONFIG" "pi-console hosts" "$ssh_block"
chmod 600 "$SSH_CONFIG"

log "Adding shell aliases"
alias_block=$(cat <<EOALIAS
alias ph='ssh pi-holo'
alias po='ssh pi-ops'
alias ps='ssh pi-sim'
alias mm='mosquitto_sub -h ${MQTT_HOST} -t "#" -v'
EOALIAS
)
update_block "$ALIAS_FILE" "pi-console aliases" "$alias_block"

if [[ -f "$HOME/.bashrc" ]]; then
  if ! grep -q "\\.bash_aliases" "$HOME/.bashrc"; then
    log "Linking .bash_aliases from .bashrc"
    printf '\nif [ -f "$HOME/.bash_aliases" ]; then\n  . "$HOME/.bash_aliases"\nfi\n' >> "$HOME/.bashrc"
  fi
else
  log "Creating minimal .bashrc that sources .bash_aliases"
  printf 'if [ -f "$HOME/.bash_aliases" ]; then\n  . "$HOME/.bash_aliases"\nfi\n' > "$HOME/.bashrc"
fi

log "Dropping MQTT watch helper"
mkdir -p "$BIN_DIR"
cat <<EOSCRIPT > "${BIN_DIR}/pi-mqtt-watch"
#!/usr/bin/env bash
set -euo pipefail
HOST="${MQTT_HOST}"
TOPIC="${1:-#}"
shift || true
exec mosquitto_sub -h "$HOST" -t "$TOPIC" -v "$@"
EOSCRIPT
chmod +x "${BIN_DIR}/pi-mqtt-watch"

if [[ -d "$HOME/.local/bin" && ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
  warn "Consider adding ~/.local/bin to PATH"
fi

log "Configuration complete"
echo "Next steps:"
echo "  1. Run 'source ~/.bash_aliases' or open a new shell to load aliases."
echo "  2. Copy your SSH key to each host (will prompt for password):"
echo "       ssh-copy-id pi@${PI_OPS_HOST}"
echo "       ssh-copy-id pi@${PI_HOLO_HOST}"
echo "       ssh-copy-id pi@${PI_SIM_HOST}"
echo "  3. Verify shortcuts: 'ph', 'po', 'ps', and 'mm'."
