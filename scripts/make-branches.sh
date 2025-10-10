#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <csv-path> [limit]" >&2
  exit 64
fi

CSV_PATH="$1"
LIMIT="${2:-}" # optional cap on number of rows to process
BASE_BRANCH="${BASE_BRANCH:-main}"
REMOTE_NAME="${REMOTE_NAME:-origin}"
MARKER_DIR="${MARKER_DIR:-automation/pr-markers}"

if [[ ! -f "$CSV_PATH" ]]; then
  echo "CSV not found: $CSV_PATH" >&2
  exit 66
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is dirty. Please commit or stash changes before running." >&2
  exit 65
fi

mkdir -p "$MARKER_DIR"

echo "▶️  Updating base branch $BASE_BRANCH"
git fetch "$REMOTE_NAME" "$BASE_BRANCH" >/dev/null
if git show-ref --verify --quiet "refs/heads/$BASE_BRANCH"; then
  git checkout "$BASE_BRANCH"
  git reset --hard "$REMOTE_NAME/$BASE_BRANCH"
else
  git checkout -b "$BASE_BRANCH" "$REMOTE_NAME/$BASE_BRANCH"
fi

process_row() {
  local id="$1"
  local branch="$2"
  local title="$3"
  local labels="$4"
  local summary="$5"

  if [[ -z "$branch" ]]; then
    echo "Skipping $id because branch name is empty" >&2
    return
  fi

  if git ls-remote --exit-code "$REMOTE_NAME" "refs/heads/$branch" >/dev/null 2>&1; then
    echo "⏭️  $branch already exists on $REMOTE_NAME; skipping"
    return
  fi

  echo "\n🚧 Creating $branch"
  git checkout "$BASE_BRANCH"
  git checkout -B "$branch" "$BASE_BRANCH"

  local marker="$MARKER_DIR/${id:-$(echo "$branch" | tr '/' '-')}.md"
  mkdir -p "$(dirname "$marker")"
  cat >"$marker" <<EOF
# $title

- id: ${id:-n/a}
- labels: ${labels:-n/a}
- summary: ${summary:-n/a}
EOF

  git add "$marker"
  git commit -m "chore: seed automation branch for ${id:-$branch}" >/dev/null
  git push -u "$REMOTE_NAME" "$branch"
}

row_index=0
while IFS=, read -r id branch title labels summary; do
  if [[ $row_index -eq 0 ]]; then
    row_index=$((row_index + 1))
    continue
  fi

  if [[ -n "$LIMIT" && $((row_index - 1)) -ge $LIMIT ]]; then
    break
  fi

  process_row "$id" "$branch" "$title" "$labels" "$summary"
  row_index=$((row_index + 1))
done <"$CSV_PATH"

git checkout "$BASE_BRANCH"

echo "\n✅ Branch creation completed"
