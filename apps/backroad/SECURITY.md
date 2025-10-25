# Security Notes

- The BackRoad Web mock app does not ship secrets. Environment variables are documented in `.env.example`.
- Mock APIs sanitize markdown input and run PII/abuse heuristics before queueing posts.
- Rate limit guards prevent more than one queued post per minute and five drafts per hour during local development.
- Token headers are stubbed via `apiClient` for future integration with a real backend.
