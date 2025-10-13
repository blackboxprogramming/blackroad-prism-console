# Pulse Check — Security & Test Readiness

## Context
- Request covers verification of secret hygiene, regression testing around auth/permissions, and readiness to merge after sign-off.

## Security Sweep
- Ran targeted ripgrep queries across `config/` and `configs/` to ensure no embedded secret values beyond path references. Only structured keys (e.g., `config/review-policy.yaml` secret placeholders, `config/repos.json` path pointers) were identified; no raw credentials surfaced.
- Spot-checked recent memory logs (`logs/memories/memory.jsonl`) for inadvertent token dumps—file only contains workflow metadata.

## Agent Access Review
- Inspected `agents/pr_cleanup_bot.py`; bot defaults to the `GITHUB_TOKEN` environment variable and only requires the GitHub `repo` scope, aligning with least-privilege practices.

## Dependency Review
- Reviewed root `package.json` to confirm dependency pins are intentional (`^` ranges retained, no unexpected version drift committed in lockfiles for this pass).

## Test Execution
- Provisioned local test environment via `make setup` (creates `.venv` with pytest/ruff/jsonschema).
- `make test` currently fails because `paho-mqtt` is absent; `agents/mac/test_patterns.py` exits early when the module cannot be imported. Installing `paho-mqtt` (or gating the test) is required before the suite can be fully validated.

## Next Steps
- [ ] Decide whether to vendor or conditionally skip Firstlight MQTT tests; unblock pytest run.
- [ ] Confirm broader agent fleet tokens remain scoped to `repo`/equivalent minimal scopes.
- [ ] Re-run the Python and Node suites once MQTT dependency decision is made.
- [ ] Monitor telemetry during the next deploy window for auth/permission anomaly spikes.
