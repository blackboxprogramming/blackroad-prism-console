#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${HOME}/.blackroad/codespaces"
PROFILE_LOADER="${TARGET_DIR}/profile.sh"

mkdir -p "${TARGET_DIR}"
cp "${SCRIPT_DIR}/profile.sh" "${TARGET_DIR}/profile.sh"
chmod 0644 "${TARGET_DIR}/profile.sh"

append_loader() {
  local shell_rc="$1"
  local marker="# >>> blackroad codespaces >>>"
  local end_marker="# <<< blackroad codespaces <<<"
  [[ -f "${shell_rc}" ]] || touch "${shell_rc}"
  if grep -Fq "${marker}" "${shell_rc}"; then
    return
  fi
  {
    echo "${marker}"
    echo "if [ -f \"${PROFILE_LOADER}\" ]; then"
    echo "  source \"${PROFILE_LOADER}\""
    echo "fi"
    echo "${end_marker}"
  } >> "${shell_rc}"
}

append_loader "${HOME}/.bashrc"
append_loader "${HOME}/.zshrc"

printf '\n✅ Codespaces dotfiles installed. Open a new shell to load the aliases.\n'
