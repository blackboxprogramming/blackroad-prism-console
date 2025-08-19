# BlackRoads ELT Starter

This repository contains a lightweight ELT stack for BlackRoads.

## Quickstart

```bash
cp .env.example .env
make up && sleep 5 && make init
make ingest && make dbt-run && make dbt-test && make validate
```

- Prefect UI: http://localhost:4200
- Metabase: http://localhost:3000

## Troubleshooting
- **Postgres auth**: ensure `docker/secrets/postgres_password.txt` matches `.env` password path. If psql fails, run `docker compose exec blackroads-postgres env | grep POSTGRES`.
- **Prefect agent not picking deployment**: make sure `blackroads-prefect-agent` container is running and `PREFECT_API_URL` is reachable.
- **dbt profile issues**: ensure `POSTGRES_PASSWORD` environment variable is supplied when running dbt commands.

## Extending
- Add S3/MinIO storage and Apache Iceberg to extend the lakehouse.

## Acceptance Checks
1. `make up` brings all services healthy on a 4 vCPU / 8 GB droplet.
2. After `make ingest && make dbt-run && make dbt-test && make validate`:
   - `raw.trips_raw` has > 0 rows.
   - dbt tests pass.
   - GE suite passes.
   - Metabase connects and can chart Daily Trips by Zone.
3. Prefect deployment shows next run at 02:00 America/Chicago.

## Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name $BLACKROADS_DOMAIN;

    location /prefect/ {
        proxy_pass http://blackroads-prefect:4200/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options SAMEORIGIN;
        add_header X-XSS-Protection "1; mode=block";
    }

    location /metabase/ {
        proxy_pass http://blackroads-metabase:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options SAMEORIGIN;
        add_header X-XSS-Protection "1; mode=block";
    }
}
```
