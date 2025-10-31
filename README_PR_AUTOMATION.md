# PR Automation (Athena Style)
**Design tenets:** observable, reversible, auditable.

## Usage
```bash
export GH_TOKEN="<token>"
OWNER=BlackRoad REPO=masterpack ./scripts/autopr.sh
```

What it does
1.Creates a timestamped branch.
2.Syncs generator artifacts (hook in scripts/sync_artifacts.sh).
3.Writes an evidence bundle to /evidence/<ts>_bootstrap/.
4.Opens a PR, applies labels, requests review, optionally enables auto-merge.
5.Prints the PR link.

### Labels that drive automation
- `automerge` – enabling this label triggers the auto-merge workflow once required
  checks succeed.
- `no-rerun` – add to a pull request to opt out of automatic CI reruns after
  the hardened Node pipeline fails.

For alias- and consent-focused wrapper configuration snippets that pair with the automation prompts, see
[`docs/WRAPPER_ALIAS_CONFIG.md`](docs/WRAPPER_ALIAS_CONFIG.md).
1. Creates a timestamped branch.
2. Syncs generator artifacts (hook in scripts/sync_artifacts.sh).
3. Writes an evidence bundle to /evidence/<ts>_bootstrap/.
4. Opens a PR, applies labels, requests review, optionally enables auto-merge.
5. Prints the PR link.

---

## 3) Optional: GitLab variant (MR)

### `scripts/autopr_gitlab.sh`
```bash
#!/usr/bin/env bash
set -euo pipefail
GL_TOKEN="${GL_TOKEN:?set GL_TOKEN}"
GL_PROJECT_ID="${GL_PROJECT_ID:?numeric project id}"
GL_API="${GL_API:-https://gitlab.com/api/v4}"
BR="chore/infra-autogen-$(date +%Y%m%d-%H%M)"

git checkout -b "$BR"
if [[ -x ./scripts/sync_artifacts.sh ]]; then ./scripts/sync_artifacts.sh; fi

git add -A && git commit -m "chore: add infra/flows/monitors + runbooks [autogen]" || true
git push -u origin "$BR"

curl --header "PRIVATE-TOKEN: $GL_TOKEN" -X POST \
  "$GL_API/projects/$GL_PROJECT_ID/merge_requests" \
  --data "source_branch=$BR&target_branch=main&title=chore: bootstrap infra & flows (autogen)&remove_source_branch=true&labels=automation,infra,flows"
```

---

## 4) Athena guardrails
•Deterministic branch naming & commit prefix
•Evidence bundle written for every run (even no‑op)
•PR auto‑merge enabled when repo allows
•CODEOWNERS + CI enforce quality gates
•Easy to swap GitHub ↔ GitLab scripts

---

## 5) Add: scripts/sync_artifacts.sh (pulls BLACKROAD_CODEX outputs and prepares evidence)

Create this helper so autopr.sh can stage artifacts automatically.

`scripts/sync_artifacts.sh`
```bash
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
```

Make executable

```bash
chmod +x scripts/sync_artifacts.sh
```

Wire into autopr.sh
autopr.sh already invokes this if present. To use an external dump directory:

```bash
OWNER=BlackRoad REPO=masterpack GH_TOKEN=*** \
  ./scripts/autopr.sh && ./scripts/sync_artifacts.sh --from ./generated
```

---

## 6) Integration checklist

Track the Slack, Asana Auth Bot, and GitLab mirroring setup in
[`docs/PR_BUNDLE_INTEGRATIONS.md`](docs/PR_BUNDLE_INTEGRATIONS.md). Update the integration status
matrix in this file once each service is configured in the target environment. When you are ready to
validate the live wiring, follow the runbook in
[`docs/VALIDATION_SPRINT.md`](docs/VALIDATION_SPRINT.md) to exercise every workflow end to end.
matrix in this file once each service is configured in the target environment.

For the broader operations rollout—including the `blackroad.io` product surface, the
`blackroadinc.us` operations hub, and the multi-system integration backlog—work from the
[`docs/BLACKROAD_OPS_INTEGRATION_PLAN.md`](docs/BLACKROAD_OPS_INTEGRATION_PLAN.md) playbook. It
describes how to generate batches of Codex prompts (10–20 at a time), assign owners across the tool
stack, and record evidence in the shared ops hub.
