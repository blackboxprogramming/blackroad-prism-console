# shellcheck shell=bash

# Guard against multiple sourcing.
if [[ -n "${BLACKROAD_DOTFILES_LOADED:-}" ]]; then
  return 0
fi
export BLACKROAD_DOTFILES_LOADED=1

# Prefer gh aliases when gh is available.
_have_gh() {
  command -v gh >/dev/null 2>&1
}

# Format PR titles using the branch prefix emoji.
fe() {
  local input="$*"
  local branch
  branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  local category=""
  if [[ "${branch}" == */* ]]; then
    category=${branch%%/*}
  fi

  local emoji="🔧"
  case "${category}" in
    test|tests) emoji="🧪" ;;
    feat|feature) emoji="✨" ;;
    fix|bugfix|hotfix) emoji="🐛" ;;
    docs|doc) emoji="📚" ;;
    ops|infra) emoji="⚙️" ;;
    chore|maintenance) emoji="🧰" ;;
    refactor) emoji="♻️" ;;
    deps|dependency) emoji="📦" ;;
    security) emoji="🛡️" ;;
    perf|performance) emoji="⚡️" ;;
  esac

  if [[ -z "${input}" && -n "${branch}" ]]; then
    input=${branch#*/}
    input=${input%-wip}
    input=${input%-ready}
    input=${input//-/ }
    input=$(printf '%s' "${input}" | awk '{for(i=1;i<=NF;i++){ $i=toupper(substr($i,1,1)) substr($i,2)}}1')
  fi

  if [[ -z "${input}" ]]; then
    input="Update"
  fi

  printf '%s %s\n' "${emoji}" "${input}"
}

if _have_gh; then
  alias gpl='gh pr list'
  alias prmy='gh pr list --author "@me" --state open'
fi

export PATH="${HOME}/.blackroad/codespaces/bin:${PATH}"
