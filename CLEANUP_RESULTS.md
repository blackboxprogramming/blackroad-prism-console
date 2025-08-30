### Summary

- Hardened API server with strict CORS allowlist, helmet, rate limiting, body size limits, and structured logging.
- Provided `.env.sample` and Jest smoke tests for health and security headers.
- Moved legacy configs and environment files to `/_trash`.
- Removed deprecated `.eslintrc.cjs` and stray `.env.aider` from repo root.

### Verification Commands

- `npm run format:check`
- `npm run lint`
- `npm test`
- `pytest srv/lucidia-llm/test_app.py`
- `curl -I http://localhost:4000/health`
- `curl -I http://localhost:4000/api/health`
