#!/usr/bin/env bash
# Syncs generator outputs into the repo tree and prepares evidence metadata.
# Usage:
#   scripts/sync_artifacts.sh --from ./generated   # where BLACKROAD_CODEX dumped files
#   scripts/sync_artifacts.sh                      # assumes artifacts already under repo

set -euo pipefail
SRC=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --from) SRC="$2"; shift 2;;
    *) echo "Unknown arg: $1"; exit 2;;
  esac
done

repo_root() {
  git rev-parse --show-toplevel 2>/dev/null || pwd
}
ROOT=$(repo_root)
cd "$ROOT"

# Folders we expect from the generator
EXPECTED=(infra flows monitors runbooks profiles)

copy_dir(){
  local d="$1"
  if [[ -n "$SRC" && -d "$SRC/$d" ]]; then
    mkdir -p "$d"
    rsync -a --delete "$SRC/$d/" "$d/"
    echo "✔ synced $d from $SRC/$d"
  else
    echo "ℹ️  $d: using existing repo contents"
  fi
}

# Sync
if [[ -n "$SRC" ]]; then
  command -v rsync >/dev/null 2>&1 || { echo "rsync required"; exit 3; }
fi
for d in "${EXPECTED[@]}"; do copy_dir "$d"; done

# Evidence dir prep
TS=$(date -u +%Y-%m-%dT%H-%MZ)
EVDIR="evidence/${TS}_bootstrap"
mkdir -p "$EVDIR/samples"

# Helper: sha256 (portable macOS/Linux)
sha256(){
  if command -v shasum >/dev/null 2>&1; then shasum -a 256 "$1" | awk '{print $1}';
  elif command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | awk '{print $1}';
  else echo "no sha256 tool" >&2; return 1; fi
}

# Create pointers.csv (path,size,sha256)
POINTERS="$EVDIR/pointers.csv"
echo "path,size,sha256" > "$POINTERS"
while IFS= read -r -d '' f; do
  sz=$(stat -f %z "$f" 2>/dev/null || stat -c %s "$f")
  sum=$(sha256 "$f" || echo "NA")
  echo "$f,$sz,$sum" >> "$POINTERS"
done < <(find infra flows monitors runbooks profiles -type f -print0 2>/dev/null || true)

# Plan & diff stubs
: > "$EVDIR/plan.txt"
(git status --porcelain; echo) > "$EVDIR/diff.json" || true

# Repository manifest hash
MANIFEST_HASH=$( (git ls-files || find . -maxdepth 2 -type f | sort) | tr -d '\r' | (shasum -a 256 || sha256sum) 2>/dev/null | (awk '{print $1}' || cat) | tail -n1 ) || true
printf "%s\n" "manifest_sha256=${MANIFEST_HASH:-NA}" > "$EVDIR/hash.sig"

echo "✅ Sync complete. Evidence at $EVDIR"
