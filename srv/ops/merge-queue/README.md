# Merge Queue Runbook

This directory contains helper scripts for applying the merge plan
produced in `merge_plan.json`.

Scripts support a dry-run mode by setting `DRY_RUN=1`.

## apply.sh
Merges pull requests in queue order and restarts impacted services
(api/yjs/bridge/jsond) before reloading nginx and deploying UI assets.

## verify.sh
Runs health checks against core endpoints. Fails non-zero if any check
fails. Requires `BLACKROAD_KEY` environment variable for authenticated
API calls.

## rollback.sh
Attempts to restore the previous state using
`/srv/blackroad-backups/rollback_latest.sh` when available, otherwise
falls back to `git revert`.
