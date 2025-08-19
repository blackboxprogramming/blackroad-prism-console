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
PY
