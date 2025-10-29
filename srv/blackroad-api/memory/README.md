# Memory API

This service exposes a lightweight Express application backed by SQLite for persisting
Cecilia's memories. It listens on port `3000` by default and stores data in
`/srv/blackroad-api/memory.db` (override with `MEMORY_DB_PATH`).

## Endpoints

- `GET /health` – service heartbeat and basic database stats.
- `POST /api/memory/index` – persist a new memory entry.
- `POST /api/memory/search` – full-text search across stored memories.

## Running locally

```
npm run memory:server
```

Environment variables:

- `PORT`: override the listening port.
- `MEMORY_DB_PATH`: set an alternate SQLite path.

## Testing

```
npx jest tests/memory_api.test.js
```
