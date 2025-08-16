#!/usr/bin/env bash
# Bootstraps a Jetson Orin with packages and configuration for Lucidia.
set -euo pipefail

# update and install OS packages
sudo apt-get update
sudo apt-get install -y \
  build-essential cmake ninja-build pkg-config \
  python3-dev python3-venv python3-pip \
  git git-lfs curl wget jq unzip \
  libopenblas-dev liblapack-dev \
  libssl-dev zlib1g-dev libffi-dev \
  libprotobuf-dev protobuf-compiler \
  libomp-dev \
  htop iotop iftop nvtop sysstat \
  tmux ripgrep fd-find \
  ufw fail2ban \
  mold ccache

# install gh if missing
if ! command -v gh >/dev/null 2>&1; then
  sudo apt-get install -y gh
fi

# sysctl tuning
sudo tee /etc/sysctl.d/99-lucidia.conf >/dev/null <<'SYSCTL'
fs.inotify.max_user_watches = 1048576
fs.inotify.max_user_instances = 1024
vm.max_map_count = 1048576
net.core.somaxconn = 4096
net.ipv4.tcp_fin_timeout = 15
SYSCTL
sudo sysctl --system

# systemd ulimits for TensorRT service
sudo mkdir -p /etc/systemd/system/lucidia-trt.service.d
sudo tee /etc/systemd/system/lucidia-trt.service.d/limits.conf >/dev/null <<'LIMITS'
[Service]
LimitNOFILE=1048576
LIMITS
sudo systemctl daemon-reload

# power and clocks
sudo nvpmodel -m 0
sudo jetson_clocks

# Python environment
VENV="$HOME/.venvs/lucidia"
python3 -m venv "$VENV"
source "$VENV/bin/activate"
pip install --upgrade pip wheel setuptools

pip install "torch>=2.2,<2.5" --extra-index-url https://download.pytorch.org/whl/cu118
pip install transformers datasets accelerate peft trl \
            sentencepiece tokenizers \
            faiss-cpu sentence-transformers \
            onnx onnxruntime-gpu \
            pydantic fastapi uvicorn \
            numpy scipy

# optional tools
pip install polygraphy onnx-graphsurgeon autoawq

# dev tools
pip install black ruff isort pre-commit gitleaks jetson-stats
pre-commit install

# TensorRT-LLM
pip install tensorrt_llm trtllm-serve || echo "TensorRT-LLM wheel install failed. Build from source if needed."

# firewall basics
sudo ufw allow 22/tcp
sudo ufw allow 8000/tcp
sudo ufw --force enable

# swapfile (8G)
if [ ! -f /swapfile ]; then
  sudo fallocate -l 8G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab
  sudo swapon -a
fi

echo "Bootstrap complete. Activate venv with: source $VENV/bin/activate"
echo "Run 'sudo jtop' to monitor system (press q to exit)."
