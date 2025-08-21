#!/usr/bin/env bash
set -euo pipefail

# Create virtual environment
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate

python -m pip install --upgrade pip
pip install -r requirements-local.txt

cat <<'MSG'
MuJoCo dependencies are skipped. To enable MuJoCo later, install mujoco and gymnasium[mujoco].
MSG

python - <<'PY'
import importlib
mods = ["numpy", "scipy", "gymnasium", "torch", "tensorboard", "tqdm", "click", "cloudpickle"]
for m in mods:
    importlib.import_module(m)
print("\N{white heavy check mark} READY")
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
