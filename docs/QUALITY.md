# Quality Engineering
- Unit/Integration tests under `apps/api/tests`.
- E2E via Playwright in `e2e/`; set `BASE_URL`.
- Load via k6 (`load/`); Chaos scripts in `chaos/` with `CHAOS_ENABLED=true`.
- Contract tests in `contracts/`; mutation testing via Stryker.
- Flaky triage workflow re-runs tests and opens an Issue.
