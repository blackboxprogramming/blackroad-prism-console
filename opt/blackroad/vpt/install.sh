#!/usr/bin/env bash
set -euo pipefail

VPT_HOME="/opt/blackroad/vpt"
REPO_DIR="$VPT_HOME/Video-Pre-Training"
VENV_DIR="$VPT_HOME/.venv"
LOG_DIR="/var/blackroad/logs/lucidia/vpt"
CFG_DIR="$VPT_HOME/config"
PROMPT_DIR="$VPT_HOME/prompts"

sudo mkdir -p "$VPT_HOME" "$LOG_DIR" "$CFG_DIR" "$PROMPT_DIR" "$VPT_HOME/models" "$VPT_HOME/weights" "$VPT_HOME/runtime"
sudo chown -R "$USER":"$USER" "$VPT_HOME"
sudo chown -R "$USER":"$USER" "$LOG_DIR"

# Python env for the service (separate from VPT’s own deps)
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"
pip install --upgrade pip wheel

# Install service deps (no OpenAI)
pip install fastapi "uvicorn[standard]" pydantic>=2 pyyaml requests tenacity psutil numpy opencv-python aiofiles watchfiles

# Get VPT repo (no package install)
if [ ! -d "$REPO_DIR" ]; then
  git clone https://github.com/openai/Video-Pre-Training.git "$REPO_DIR"
fi

# Install VPT’s own deps into the same venv for simplicity
# (This follows the repo’s own requirements; adjust if your system needs pinned Torch/CUDA)
pip install -r "$REPO_DIR/requirements.txt" || true
# MineRL often installs from GitHub for latest env fixes:
pip install "git+https://github.com/minerllabs/minerl" || true

# Default API token (change later)
if [ ! -f "$VPT_HOME/.token" ]; then
  head -c 24 /dev/urandom | base64 | tr -d '\n' > "$VPT_HOME/.token"
fi

echo "Install complete.
Next:
1) Put model files in $VPT_HOME/models and weights in $VPT_HOME/weights
2) Edit $CFG_DIR/vpt.config.yml if needed
3) sudo systemctl enable --now lucidia-vpt.service
4) Try: vptctl status
"
