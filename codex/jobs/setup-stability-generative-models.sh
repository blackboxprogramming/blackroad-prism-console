#!/usr/bin/env bash
set -euo pipefail

# === Config ===
REPO_URL="https://github.com/Stability-AI/generative-models.git"
BASE_DIR="/opt/generative-models"
VENV_NAME=".pt2"                          # matches README virtualenv name
PYTHON_BIN="${PYTHON_BIN:-python3.10}"    # README is tested on Python 3.10
TORCH_INDEX_URL="${TORCH_INDEX_URL:-https://download.pytorch.org/whl/cu118}"  # adjust if needed
HF_TOKEN="${HF_TOKEN:-}"                   # optional: export HF_TOKEN before running weights commands

# === Helpers ===
log(){ printf "\n\033[1;36m[gm-setup]\033[0m %s\n" "$*"; }
die(){ printf "\n\033[1;31m[gm-setup ERROR]\033[0m %s\n" "$*" ; exit 1; }

ensure_cmd() { command -v "$1" >/dev/null 2>&1 || die "Missing '$1'. Install it first."; }

activate_venv() {
  # shellcheck disable=SC1091
  source "${BASE_DIR}/${VENV_NAME}/bin/activate"
}

write_gm_wrapper() {
  local gm="${BASE_DIR}/bin/gm"
  mkdir -p "${BASE_DIR}/bin"
  cat > "${gm}" <<'GM_EOF'
#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="/opt/generative-models"
VENV="${BASE_DIR}/.pt2"
PY="${VENV}/bin/python"
STREAMLIT="${VENV}/bin/streamlit"
HF="${VENV}/bin/huggingface-cli"
export PYTHONPATH="${BASE_DIR}"

fail(){ echo "[gm] $1" >&2; exit 1; }
[ -x "${PY}" ] || fail "venv missing. Run: bash /opt/codex/jobs/setup-stability-generative-models.sh install"

cmd="${1:-}"; shift || true

case "${cmd}" in
  doctor)
    "${PY}" - <<'PYEOF'
import torch, sys, platform
print("Python:", platform.python_version())
print("CUDA available:", torch.cuda.is_available())
print("Torch version:", torch.__version__)
if torch.cuda.is_available():
    print("CUDA device:", torch.cuda.get_device_name(0))
PYEOF
    ;;

  demo)
    which="${1:-}"; shift || true
    case "${which}" in
      svd|sv3d)
        exec "${STREAMLIT}" run "${BASE_DIR}/scripts/demo/video_sampling.py" "$@"
        ;;
      turbo)
        exec "${STREAMLIT}" run "${BASE_DIR}/scripts/demo/turbo.py" "$@"
        ;;
      *)
        echo "Usage: gm demo {svd|sv3d|turbo} [streamlit args...]"; exit 2;;
    esac
    ;;

  sv3d_u)
    # image -> multi-view/orbit video (SV3D_u)
    exec "${PY}" "${BASE_DIR}/scripts/sampling/simple_video_sample.py" --version sv3d_u "$@"
    ;;

  sv3d_p)
    # image -> multi-view/orbit video (SV3D_p)
    exec "${PY}" "${BASE_DIR}/scripts/sampling/simple_video_sample.py" --version sv3d_p "$@"
    ;;

  sv4d)
    # video -> 4D (original SV4D; needs sv3d_u/p + sv4d weights)
    exec "${PY}" "${BASE_DIR}/scripts/sampling/simple_video_sample_4d.py" "$@"
    ;;

  sv4d2)
    # video -> 4D (SV4D 2.0 single-model)
    exec "${PY}" "${BASE_DIR}/scripts/sampling/simple_video_sample_4d2.py" "$@"
    ;;

  weights)
    what="${1:-}"; shift || true
    mkdir -p "${BASE_DIR}/checkpoints"
    case "${what}" in
      sv4d2)
        exec "${HF}" download stabilityai/sv4d2.0 sv4d2.safetensors --local-dir "${BASE_DIR}/checkpoints" "$@"
        ;;
      sv4d2_8)
        exec "${HF}" download stabilityai/sv4d2.0 sv4d2_8views.safetensors --local-dir "${BASE_DIR}/checkpoints" "$@"
        ;;
      sv4d)
        exec "${HF}" download stabilityai/sv4d sv4d.safetensors --local-dir "${BASE_DIR}/checkpoints" "$@"
        ;;
      sv3d_u)
        exec "${HF}" download stabilityai/sv3d sv3d_u.safetensors --local-dir "${BASE_DIR}/checkpoints" "$@"
        ;;
      sv3d_p)
        exec "${HF}" download stabilityai/sv3d sv3d_p.safetensors --local-dir "${BASE_DIR}/checkpoints" "$@"
        ;;
      sdxl_base)
        exec "${HF}" download stabilityai/stable-diffusion-xl-base-1.0 --repo-type model --local-dir "${BASE_DIR}/checkpoints" "$@"
        ;;
      sdxl_refiner)
        exec "${HF}" download stabilityai/stable-diffusion-xl-refiner-1.0 --repo-type model --local-dir "${BASE_DIR}/checkpoints" "$@"
        ;;
      sdxl_turbo)
        exec "${HF}" download stabilityai/sdxl-turbo --repo-type model --local-dir "${BASE_DIR}/checkpoints" "$@"
        ;;
      *)
        echo "Usage: gm weights {sv4d2|sv4d2_8|sv4d|sv3d_u|sv3d_p|sdxl_base|sdxl_refiner|sdxl_turbo}"
        exit 2;;
    esac
    ;;

  *)
    cat <<USAGE
gm — Generative-Models helper
USAGE:
  gm doctor
  gm demo {svd|sv3d|turbo} [--server.port 7860]
  gm sv3d_u --input_path path/to/image.png
  gm sv3d_p --input_path path/to/image.png [--elevations_deg 10.0]
  gm sv4d  --input_path path/to/video.mp4 [--sv3d_version sv3d_u|sv3d_p] [--elevations_deg 30.0]
  gm sv4d2 --input_path path/to/video.mp4|.gif [--output_folder outputs]
  gm weights {sv4d2|sv4d2_8|sv4d|sv3d_u|sv3d_p|sdxl_base|sdxl_refiner|sdxl_turbo}
USAGE
    exit 2;;
esac
GM_EOF
  chmod +x "${gm}"

  # Make available on PATH if possible
  if [ -w "/usr/local/bin" ]; then
    ln -sf "${gm}" /usr/local/bin/gm
  else
    log "Add to PATH to use: export PATH=\"${BASE_DIR}/bin:$PATH\""
  fi
}

install_stack() {
  log "Checking prerequisites"
  ensure_cmd git
  ensure_cmd ${PYTHON_BIN}

  log "Cloning/pulling repository"
  if [ -d "${BASE_DIR}/.git" ]; then
    git -C "${BASE_DIR}" pull --ff-only
  else
    sudo mkdir -p "${BASE_DIR}" 2>/dev/null || true
    sudo chown -R "$(id -u)":"$(id -g)" "${BASE_DIR}" 2>/dev/null || true
    git clone "${REPO_URL}" "${BASE_DIR}"
  fi

  log "Creating virtualenv (${VENV_NAME})"
  cd "${BASE_DIR}"
  ${PYTHON_BIN} -m venv "${VENV_NAME}"
  activate_venv

  log "Installing PyTorch (index: ${TORCH_INDEX_URL})"
  pip install --upgrade pip
  pip install torch torchvision torchaudio --index-url "${TORCH_INDEX_URL}"

  log "Installing repo requirements & package"
  pip install -r requirements/pt2.txt
  pip install .
  pip install -e 'git+https://github.com/Stability-AI/datapipelines.git@main#egg=sdata' || true

  log "Installing extras (streamlit-keyup for Turbo, HF CLI)"
  pip install streamlit-keyup 'huggingface_hub[cli]'

  mkdir -p "${BASE_DIR}/checkpoints" "${BASE_DIR}/outputs"
  write_gm_wrapper

  log "Done. Try: gm doctor"
}

case "${1:-}" in
  install|"")
    install_stack
    ;;
  *)
    echo "Usage: bash $0 install"
    exit 2
    ;;
esac
