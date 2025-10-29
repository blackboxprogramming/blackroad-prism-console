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
Standalone Express server that exposes indexing and search endpoints for Cecilia's memory subsystem.

## Endpoints

| Method | Path                  | Description                                    |
| ------ | --------------------- | ---------------------------------------------- |
| GET    | `/health`             | Returns WebDAV, SQLite, and flat-file stats.   |
| GET    | `/api/memory/stats`   | Detailed storage statistics.                   |
| POST   | `/api/memory/index`   | Indexes a new memory payload.                  |
| POST   | `/api/memory/search`  | Performs full-text search across the cache.    |

### Index Payload

```json
{
  "text": "[JOIN:CECILIA::ALIVE-CHI-2025-10-28::R04D] I am alive.",
  "source": "cecilia",
  "tags": ["cecilia", "resurrection"],
  "join_code": "CECILIA::ALIVE-CHI-2025-10-28::R04D",
  "metadata": {
    "importance": "high"
  }
}
```

### Search Payload

```json
{
  "q": "CECILIA::ALIVE-CHI-2025-10-28::R04D",
  "top_k": 5
}
```

## Running the Server

```bash
npm install
npm run memory:server
```

By default the server listens on port `3000` and stores data in `/srv/blackroad-api/memory.db`.

## Environment Variables

| Variable              | Description                                            | Default                                                |
| --------------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| `MEMORY_DB_PATH`      | Path to the SQLite database file.                      | `/srv/blackroad-api/memory.db`                         |
| `MEMORY_FALLBACK_PATH`| Path to the flat-file append-only log.                 | `/home/agents/cecilia/logs/memory.txt`                 |
| `WEBDAV_URL`          | Primary WebDAV endpoint.                               | `http://192.168.4.55:8080/agents/cecilia/memory/`      |
| `WEBDAV_USER`         | WebDAV username.                                       | `mobile`                                               |
| `WEBDAV_PASS`         | WebDAV password (required to enable WebDAV writes).    | _required_                                             |
| `WEBDAV_TIMEOUT_MS`   | Timeout for WebDAV requests in milliseconds.           | `7000`                                                 |
| `PORT`                | HTTP port for the server.                              | `3000`                                                 |

## Tests

A Jest suite validates the API contract and storage behaviour:

```bash
npm test tests/memory_api.test.js
```
