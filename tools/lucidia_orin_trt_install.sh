#!/usr/bin/env bash
set -euo pipefail

VENV=${1:-trtllm-venv}
python3 -m venv "$VENV"
source "$VENV/bin/activate"
pip install --upgrade pip
# Install TensorRT-LLM from NVIDIA PyPI
pip install --extra-index-url https://pypi.nvidia.com tensorrt-llm

echo "TensorRT-LLM installed in $VENV"
echo "Run with: trtllm-serve <MODEL_PATH> --port 8000 --host 0.0.0.0"
