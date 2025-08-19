# <!-- FILE: /srv/blackroads/elt/Makefile -->
COMPOSE = docker compose --env-file .env -p blackroads -f docker-compose.yml

up:
$(COMPOSE) up -d

down:
$(COMPOSE) down

logs:
$(COMPOSE) logs -f

init:
$(COMPOSE) run --rm blackroads-pipelines bash -lc "psql postgresql://$${POSTGRES_USER}:$$(cat $${POSTGRES_PASSWORD_FILE})@$${POSTGRES_HOST}:$${POSTGRES_PORT}/$${POSTGRES_DB} -f sql/bootstrap.sql"
$(MAKE) dbt-seed
$(MAKE) dbt-run
$(COMPOSE) run --rm blackroads-pipelines python pipelines/flow.py --deploy

ingest:
$(COMPOSE) run --rm blackroads-pipelines python pipelines/ingest_nyc_taxi.py

flow-run:
$(COMPOSE) run --rm blackroads-pipelines prefect deployment run etl-flow/daily

dbt-run:
$(COMPOSE) run --rm blackroads-dbt run

dbt-test:
$(COMPOSE) run --rm blackroads-dbt test

dbt-docs:
$(COMPOSE) run --rm -p 8080:8080 blackroads-dbt docs serve --port 8080 --no-browser

dbt-seed:
$(COMPOSE) run --rm blackroads-dbt seed

validate:
$(COMPOSE) run --rm blackroads-pipelines python pipelines/validate.py

fmt:
$(COMPOSE) run --rm blackroads-pipelines ruff format pipelines dbt
