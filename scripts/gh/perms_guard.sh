#!/usr/bin/env bash
# Idempotent branch protections + security enablement via GitHub CLI (gh).
# Usage: OWNER=org REPO=name ./scripts/gh/perms_guard.sh ci,perms-assert main
set -euo pipefail
: "${OWNER:?Set OWNER}"; : "${REPO:?Set REPO}"
REQ_CHECKS="${1:-ci,perms-assert}"
BR="${2:-$(gh repo view "$OWNER/$REPO" --json defaultBranchRef -q .defaultBranchRef.name)}"
TMP_JSON="$(mktemp)"
echo "[*] Repo: $OWNER/$REPO  branch: $BR"
IFS=, read -r -a CONTEXTS <<<"$REQ_CHECKS"
jq -n --arg br "$BR" --argjson ctx "$(printf '%s\n' "${CONTEXTS[@]}" | jq -R . | jq -s .)" '
{
  required_status_checks: { strict: true, contexts: $ctx },
  enforce_admins: true,
  required_pull_request_reviews: {
    required_approving_review_count: 1,
    require_code_owner_reviews: true,
    dismiss_stale_reviews: true
  },
  restrictions: null,
  required_linear_history: true,
  allow_force_pushes: false,
  allow_deletions: false,
  block_creations: false
}' > "$TMP_JSON"

# Classic branch protection API
gh api -X PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/$OWNER/$REPO/branches/$BR/protection" \
  --input "$TMP_JSON" >/dev/null
echo "[+] Branch protection applied"

# Security & analysis (Advanced Security, Secret Scanning, Push Protection)
jq -n '
{ security_and_analysis:
  { advanced_security: {status:"enabled"},
    secret_scanning: {status:"enabled"},
    secret_scanning_push_protection: {status:"enabled"} } }' > "$TMP_JSON"
gh api -X PATCH "/repos/$OWNER/$REPO" --input "$TMP_JSON" >/dev/null
echo "[+] Security & analysis enabled"

rm -f "$TMP_JSON"
echo "[✓] perms_guard: OK"
