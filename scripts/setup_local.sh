#!/usr/bin/env bash
set -e

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"

if [ ! -d .venv ]; then
    python3 -m venv .venv
fi

source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements-local.txt

echo "Skipping MuJoCo installation. To enable later: pip install mujoco gymnasium[mujoco]"

python - <<'PY'
import numpy, scipy, gymnasium, torch, tensorboard, tqdm, click, cloudpickle
print('✅ READY')
PY
