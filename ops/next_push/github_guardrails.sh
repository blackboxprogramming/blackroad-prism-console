#!/usr/bin/env bash
set -euo pipefail

ORG=blackboxprogramming
REPOS=("br-platform-hub" "br-products-site" "blackroad-prism-console")

# Enable security features
for R in "${REPOS[@]}"; do
  gh api -X PUT "repos/$ORG/$R" -F security_and_analysis='{ "advanced_security": {"status":"enabled"} }' || true
  gh api -X PATCH "repos/$ORG/$R" -f vulnerability_alerts=true || true
done

# Branch protection on main (reviews + CI check)
for R in "${REPOS[@]}"; do
  gh api -X PUT "repos/$ORG/$R/branches/main/protection" \
    -F required_status_checks='{"strict":true,"contexts":["ci"]}' \
    -F enforce_admins=true \
    -F required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
    -F restrictions='null' || true
done

# Add CODEOWNERS + PR template to new repos
for R in "br-platform-hub" "br-products-site"; do
  gh repo clone "$ORG/$R" && cd "$R"
  mkdir -p .github && printf "* @blackboxprogramming/admins\n" > .github/CODEOWNERS
  cat > .github/pull_request_template.md <<'MD'
## Summary
- 

## Checklist
- [ ] Tests pass (CI)
- [ ] Docs updated
- [ ] Linked issue
MD
  git add .github && git commit -m "chore: CODEOWNERS + PR template" && git push
  cd ..
done
