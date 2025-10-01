# BlackRoad.io Docker Setup

This configuration builds the React frontend and Node.js API into separate containers.

## Build and Run

```bash
docker-compose up -d --build
```

The API container stores its SQLite database under `/srv/blackroad-api/data/blackroad.db`. The path can be overridden by
setting the `BLACKROAD_DB_PATH` environment variable.

## View Logs

```bash
docker-compose logs -f
```

## Inspect the SQLite Database

```bash
docker-compose exec blackroad-api sqlite3 /srv/blackroad-api/data/blackroad.db
```

## Health Checks

- API: http://localhost:4000/api/health
- UI:  http://localhost:5173/health
