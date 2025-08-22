# MOVEFILE — BlackRoad consolidation
# One-time mapping of files/dirs to the final mono-repo layout.

## 1) Prism UI + site shell
# (if currently at repo root or /prism)
FROM  / (or) /prism
TO    /sites/blackroad
WHY   Prism is the primary UI shell and should live under sites/. 
NOTE  You merged index toward Prism in the other repo; this is the canonical home. 
REF   turn70file12

## 2) Ops: nginx + bootstrap
FROM  /nginx/blackroad.io.conf
TO    /ops/nginx/blackroad.io.conf
WHY   Single source for reverse proxy (routes /api -> :4000 bridge, SPA fallback).
REF   turn70file9

FROM  /scripts/bootstrap-site.sh
TO    /ops/scripts/bootstrap-site.sh
WHY   Keep the working deploy helper where ops lives.
REF   turn70file9

## 3) Lucidia local-only stack (compose + units)
FROM  (stack root: compose, bootstrap, systemd/*.service)
TO    /stacks/lucidia-local/ (same filenames)
WHY   Local-only stack should be isolated + versioned as a dev stack.
REF   turn70file5, turn70file3

## 4) Services: FastAPI "Lucidia Bridge"
FROM  (existing bridge app root/tests)
TO    /services/bridge/
WHY   API surface for agents/knowledge/contradictions; unified import path.
REF   turn70file13

## 5) Packages: Agent library
FROM  (multi-agent lib: Curator/Guardian/Roadie, shared utils)
TO    /packages/agents/src/
WHY   Re-use across UI and services; central import path.
REF   turn70file2

FROM  (bridge tests, api endpoint tests)
TO    /packages/agents/tests/
WHY   Make pytest discoverable in CI next to package source.
REF   turn70file13

## 6) Tools: Autotester
FROM  (autotester skeleton with roadcoin mappings)
TO    /tools/lucidia-autotester/
WHY   Nightly sanity checks for API/ledger endpoints.
REF   turn70file7

## 7) CI workflows
KEEP  /.github/workflows/ai-review.yml
WHY   Your strict JSON reviewer is actually useful on PRs.
REF   turn70file11

KEEP  primary build/test workflow (pin python to 3.11)
WHY   You already moved to 3.11 across actions.
REF   turn70file0

DROP  duplicate or “non-essential” legacy workflows that conflict with Prism deploy.
WHY   You already did a cleanup; finish it and keep previews for the site-only branch.
REF   turn70file0

## 8) Remove conflicting/legacy Prism roots
DROP  any nginx/site roots that switch to /var/www/prism spuriously
WHY   They fight with the canonical ops/nginx/blackroad.io.conf.
REF   turn70file12
