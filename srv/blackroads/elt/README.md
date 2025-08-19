<!-- FILE: /srv/blackroads/elt/README.md -->
# BlackRoads ELT Starter

This repository provides a minimal ELT stack for **BlackRoads** using Postgres, Prefect, dbt, Great Expectations, and Metabase.

## Quickstart
```bash
cp .env.example .env
make up && sleep 5 && make init
make ingest && make dbt-run && make dbt-test && make validate
```

- Prefect UI: http://localhost:4200
- Metabase: http://localhost:3000

## Troubleshooting
- **Postgres auth**: ensure `POSTGRES_PASSWORD_FILE` points to the secret file and the file is mounted.
- **Prefect agent not picking deployment**: check agent logs with `make logs` and confirm the work queue name.
- **dbt profile issues**: make sure environment variables match the database credentials and schemas.

## How to Extend
Future enhancements include adding S3/MinIO storage and Iceberg tables.

## Nginx Reverse Proxy (optional)
```nginx
server {
    listen 443 ssl;
    server_name $BLACKROADS_DOMAIN;

    location /prefect/ {
        proxy_pass http://blackroads-prefect:4200/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options DENY;
    }

    location /metabase/ {
        proxy_pass http://blackroads-metabase:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options DENY;
    }
}
```

## Acceptance Checks
- `make up` brings all services healthy on a 4 vCPU / 8 GB droplet
- After `make ingest && make dbt-run && make dbt-test && make validate`:
  - `raw.trips_raw` has > 0 rows
  - dbt tests pass
  - GE suite passes
  - Metabase connects and can chart Daily Trips by Zone
- Prefect scheduled run shows next at **02:00 America/Chicago**
