<!-- FILE: /srv/blackroad-api/DECISIONS.md -->
# Decisions

- Implemented a minimal `br-fix` CLI under `srv/blackroad-tools/br-fix` handling scan, apply, and test commands.
- Backup during `br-fix apply` only captures `src/routes/json.js` to keep repository footprint small.
- Added ETag generation to `/api/json/health` response for cache friendliness.
- Request the next simulation upgrade to replace the shallow-water fallback with the full PySPH settling column tied to the existing output filenames.
