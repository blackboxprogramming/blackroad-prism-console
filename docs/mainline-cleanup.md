# Mainline Cleanup Runbook

## Purpose
This runbook aligns the recent cleanup findings with the merge-plan operational checklist so that responders can triage, remediate, verify, and hand off ownership without jumping across multiple documents.

> **TL;DR — automation agent view**
>
>| Phase | Command palette | Primary owner | Success criteria |
>| --- | --- | --- | --- |
>| Bootstrap | `bash ops/install.sh` | Automation agent | Dependency install completes with no errors or prompts. |
>| Dependency sync | `node tools/dep-scan.js --dir srv/blackroad-api --save` | Automation agent (only when imports change) | Script exits 0 and only expected manifest files change. |
>| Tests & lint | `cd srv/blackroad-api && npm test && npm run lint` | API steward / automation agent | Both commands finish successfully. |
>| Health & runtime | `npm run health`<br>`bash tools/verify-runtime.sh` | Runtime SRE / automation agent | Both checks return exit code 0 and print "All quick checks passed". |

## Flow

### 1. Triage
- Review **cleanup plan findings**:
  - Remove or archive superseded assets (`srv/blackroad-api/server.js`, duplicate configs, committed env files).
  - Address unsafe defaults (missing `/health`, weak secrets, permissive shell flags).
  - Identify missing tests, CI coverage, and Makefile targets.
- Capture risks called out in the plan (tightened CORS/session settings, env file moves, middleware changes).
- Confirm the latest cleanup results to understand what has already been hardened (API middleware, env scaffolding, CI additions) and what still requires confirmation on the current branch.
- Log any new regressions or artifacts discovered during triage in `CLEANUP_RESULTS.md` so the remediation phase has a fresh baseline.

### 2. Remediate
- Remove or relocate the dead files and duplicated configs highlighted during triage; ensure replacements live in `/_trash` when archival is required.
- Harden runtime settings by enforcing `/health`, helmet, CORS allowlist, rate limiting, and request logging as reflected in the recent cleanup results.
- Regenerate env samples and Makefile targets so that local and CI workflows share consistent entry points.
- Update CI definitions to keep format, lint, test, and smoke checks in place; avoid widening scopes without stakeholder review.
- Record which merge dependencies were touched so the operational checklist can track risk across API, bridge, and UI components.

### 3. Verify
- Execute the **command palette** above (bootstrap, dep-scan as needed, tests, lint, and runtime checks).
- Run cleanup-specific verification commands:
  - `npm run format:check`
  - `npm run lint`
  - `npm test`
  - `pytest srv/lucidia-llm/test_app.py`
  - `curl -I http://localhost:4000/health`
  - `curl -I http://localhost:4000/api/health`
- Step through the merge-plan operational checklist and confirm each item is satisfied:
  - Security sweep for credentials and tokens.
  - Dependency and least-privilege reviews.
  - CI/CD parity across environments.
  - Deploy window monitoring plan.
- Document outcomes and attach logs or command outputs so the handoff team can audit without re-running everything.

### 4. Handoff
- Update the merge plan to reflect checklist completion, remaining risks, and any deferred follow-up work.
- Notify the release coordinator and runtime SREs with a short status: what changed, which commands passed, and any watch-items for the deploy window.
- Archive triage notes and remediation diffs alongside this runbook so future cleanup cycles start with a consistent record.
- Confirm that automation agents have the TL;DR commands and owners before exiting—this keeps future runs aligned with the same flow.
