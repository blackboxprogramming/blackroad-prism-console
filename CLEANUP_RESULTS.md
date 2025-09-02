### Summary

- Hardened API server with /health endpoint, helmet, CORS allowlist, rate limiting, and request logging.
- Added `.env.sample`, Jest/Pytest smoke tests, Makefile, and CI workflow.
- Moved legacy configs and environment files to `/_trash`.
- Removed deprecated `.eslintrc.cjs` and stray `.env.aider` from repo root.

### Verification Commands

- `npm run format:check`
- `npm run lint`
- `npm test`
- `pytest srv/lucidia-llm/test_app.py`
- `curl -I http://localhost:4000/health`
- `curl -I http://localhost:4000/api/health`
