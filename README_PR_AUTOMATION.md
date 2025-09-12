# PR Automation (Athena Style)
**Design tenets:** observable, reversible, auditable.

## Usage
```bash
export GH_TOKEN="<token>"
OWNER=BlackRoad REPO=masterpack ./scripts/autopr.sh
```

What it does
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
