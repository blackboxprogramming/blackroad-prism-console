#!/usr/bin/env bash
set -euo pipefail

# Simple builder for the lucidia_gemm module
# Requirements: CUDA Toolkit >= 11.8, cuBLASLt, Python3 dev, pybind11, CMake >= 3.20, LibTorch (PyTorch C++)

# Optional: vendor CUTLASS locally (recommended for reproducibility)
#   git submodule add https://github.com/NVIDIA/cutlass.git third_party/cutlass
#   export CUTLASS_DIR="$(pwd)/third_party/cutlass"

if [[ -z "${BUILD_DIR:-}" ]]; then BUILD_DIR="build"; fi
mkdir -p "${BUILD_DIR}"
cd "${BUILD_DIR}"

cmake -DCMAKE_BUILD_TYPE=Release \
      -DCUTLASS_DIR="${CUTLASS_DIR:-}" \
      -DUSE_FETCHCONTENT_CUTLASS=ON \
      ..

cmake --build . -j

# Copy module near tests for quick import, or install into your PYTHONPATH
MOD=$(ls lucidia_gemm.*.so)
echo "Built module: ${MOD}"
echo "To use: export PYTHONPATH=$(pwd):$PYTHONPATH"
