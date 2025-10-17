#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<USAGE
Usage: $(basename "$0") [--dry-run] [csv_path]

Reads pull request definitions from a CSV file and creates draft PRs via the GitHub CLI.

Columns (header row required):
  title,head_branch,base_branch,labels,body,draft

- labels are optional and should be separated with semicolons (e.g. "deps;ci").
- set draft to "true" or "false".
- body should avoid commas or wrap the value in quotes.

Examples:
  $(basename "$0") prs.csv
  $(basename "$0") --dry-run custom.csv
USAGE
}

file="prs.csv"
dry_run=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --dry-run)
      dry_run=true
      shift
      ;;
    *)
      file="$1"
      shift
      ;;
  esac
 done

if [[ ! -f "$file" ]]; then
  echo "CSV file not found: $file" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "The GitHub CLI (gh) is required." >&2
  exit 1
fi

strip() {
  local value="${1}\n"
  value="${value%\\n}"
  value="${value%$'\r'}"
  value="${value#\"}"
  value="${value%\"}"
  echo "$value"
}

run_command() {
  if $dry_run; then
    printf 'DRY RUN =>'
    for arg in "$@"; do
      printf ' %q' "$arg"
    done
    printf '\n'
  else
    "$@"
  fi
}

echo "Processing definitions from $file"

tail -n +2 "$file" | tr -d '\r' | while IFS=',' read -r raw_title raw_head raw_base raw_labels raw_body raw_draft; do
  # skip empty lines
  if [[ -z "${raw_title// }" && -z "${raw_head// }" ]]; then
    continue
  fi

  title=$(strip "$raw_title")
  head=$(strip "$raw_head")
  base=$(strip "$raw_base")
  labels_field=$(strip "$raw_labels")
  body=$(strip "$raw_body")
  draft_field=$(strip "${raw_draft:-false}")

  if [[ -z "$title" || -z "$head" || -z "$base" ]]; then
    echo "Skipping row with missing required columns: $raw_title" >&2
    continue
  fi

  if [[ -z "$body" ]]; then
    body="Automated bundle stub created by scripts/bulk-create-prs.sh"
  fi

  declare -a label_args=()
  if [[ -n "$labels_field" ]]; then
    IFS=';' read -ra label_list <<< "$labels_field"
    for label in "${label_list[@]}"; do
      cleaned=$(echo "$label" | xargs)
      if [[ -n "$cleaned" ]]; then
        label_args+=("--label" "$cleaned")
      fi
    done
  fi

  draft_flag=""
  shopt -s nocasematch
  if [[ "$draft_field" == "true" ]]; then
    draft_flag="--draft"
  fi
  shopt -u nocasematch

  if ! git show-ref --verify --quiet "refs/heads/$head" && ! git ls-remote --exit-code --heads origin "$head" >/dev/null 2>&1; then
    echo "Warning: branch '$head' not found locally or on origin." >&2
  fi

  cmd=(gh pr create --title "$title" --head "$head" --base "$base" --body "$body")
  if [[ -n "$draft_flag" ]]; then
    cmd+=("$draft_flag")
  fi
  if [[ ${#label_args[@]} -gt 0 ]]; then
    cmd+=("${label_args[@]}")
  fi

  # shellcheck disable=SC2068
  run_command "${cmd[@]}"
done
