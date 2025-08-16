#!/usr/bin/env bash
set -euo pipefail

MODEL_DIR=${1:-models/merged/lucidia-neox-1.4b}
OUT_DIR=${2:-${MODEL_DIR}-trt}

echo "Building TensorRT engine from $MODEL_DIR"
trtllm-build --checkpoint "$MODEL_DIR" --build-dir "$OUT_DIR" "$@"
