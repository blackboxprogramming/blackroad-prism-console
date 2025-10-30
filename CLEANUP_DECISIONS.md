<!-- FILE: CLEANUP_DECISIONS.md -->

# Cleanup Decisions

## Security

- Loaded environment variables via `dotenv` and require `SESSION_SECRET`, `INTERNAL_TOKEN`, and `ALLOW_ORIGINS` at startup.
- Added `X-Request-Id` header and request logging with method, path, status, duration, and id.
- Enforced JSON and URL-encoded body limits (1 MB each).

## Environment

- Provided `.env.sample` documenting required variables.
- Moved tracked log directories to `_trash/` and ignored future logs in `.gitignore`.

## Testing

- Expanded Jest health test to verify security headers and request id.
- `RUNME.sh` runs lint, Jest, and Pytest for the LLM stub.

## Non-Goals

- No changes to routing, database schema, or SPA content.
