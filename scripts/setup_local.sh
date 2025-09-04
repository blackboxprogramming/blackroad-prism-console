#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate

python -m pip install --upgrade pip
pip install -r requirements-local.txt

echo "Skipping MuJoCo installation. To enable later: pip install mujoco gymnasium[mujoco]"

python - <<'PY'
import importlib
mods = ["numpy", "scipy", "gymnasium", "torch", "tensorboard", "tqdm", "click", "cloudpickle"]
for m in mods:
    importlib.import_module(m)
print("✅ READY")
PY
