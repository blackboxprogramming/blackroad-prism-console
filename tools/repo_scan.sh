#!/usr/bin/env bash
set -euo pipefail

# Determine the repository root. If git is unavailable we default to the
# current working directory so the script still operates when PATH is minimal.
if command -v git >/dev/null 2>&1; then
  repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
else
  repo_root="$(pwd)"
fi

# Allow callers to provide their own list of keywords as arguments. If none are
# supplied we fall back to a small default list that looks for common markers.
if [[ $# -gt 0 ]]; then
  mapfile -t keywords < <(printf '%s\n' "$@" | sed '/^\s*$/d')
else
  keywords=(
    "TODO"
    "FIXME"
    "HACK"
    "BUG"
  )
fi

if [[ ${#keywords[@]} -eq 0 ]]; then
  echo "repo_scan: no keywords provided; nothing to do." >&2
  exit 0
fi

scan_with_grep=false
if ! command -v rg >/dev/null 2>&1; then
  echo "repo_scan: ripgrep (rg) is not installed or not available in PATH." >&2
  echo "repo_scan: install ripgrep for faster searches: https://github.com/BurntSushi/ripgrep#installation" >&2
  if command -v grep >/dev/null 2>&1; then
    echo "repo_scan: falling back to grep; results may be slower." >&2
    scan_with_grep=true
  else
    echo "repo_scan: neither ripgrep nor grep is available; skipping keyword scan." >&2
    exit 0
  fi
fi

search_with_rg() {
  local keyword="$1"
  rg \
    --hidden \
    --glob '!.git' \
    --color=never \
    --no-heading \
    --line-number \
    --smart-case \
    --fixed-strings \
    -- "$keyword" \
    "$repo_root" || true
}

search_with_grep() {
  local keyword="$1"
  GREP_COLORS='' GREP_COLOR='' grep \
    -RIn \
    --exclude-dir='.git' \
    --binary-files=without-match \
    -- "$keyword" \
    "$repo_root" || true
}

for keyword in "${keywords[@]}"; do
  if [[ -z "$keyword" ]]; then
    continue
  fi

  if [[ "$scan_with_grep" == true ]]; then
    search_with_grep "$keyword"
  else
    search_with_rg "$keyword"
  fi

done
