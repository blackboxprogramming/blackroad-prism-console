COMPOSE=docker compose -f docker-compose.yml -p blackroads
PGPASSWORD=$(shell cat docker/secrets/postgres_password.txt)

up:
$(COMPOSE) up -d

down:
$(COMPOSE) down

logs:
$(COMPOSE) logs -f

init:
PGPASSWORD=$(PGPASSWORD) $(COMPOSE) exec -T blackroads-postgres psql -U $$POSTGRES_USER -d $$POSTGRES_DB -f sql/bootstrap.sql
POSTGRES_PASSWORD=$(PGPASSWORD) $(COMPOSE) run --rm blackroads-dbt dbt seed
POSTGRES_PASSWORD=$(PGPASSWORD) $(COMPOSE) run --rm blackroads-dbt dbt run
$(COMPOSE) run --rm blackroads-pipelines python pipelines/flow.py

ingest:
$(COMPOSE) run --rm blackroads-pipelines python pipelines/ingest_nyc_taxi.py

flow-run:
$(COMPOSE) run --rm blackroads-pipelines prefect deployment run 'elt-flow/daily'

dbt-run:
POSTGRES_PASSWORD=$(PGPASSWORD) $(COMPOSE) run --rm blackroads-dbt dbt run

dbt-test:
POSTGRES_PASSWORD=$(PGPASSWORD) $(COMPOSE) run --rm blackroads-dbt dbt test

dbt-docs:
POSTGRES_PASSWORD=$(PGPASSWORD) $(COMPOSE) run --rm blackroads-dbt dbt docs generate

validate:
$(COMPOSE) run --rm blackroads-pipelines python pipelines/validate.py

fmt:
$(COMPOSE) run --rm blackroads-pipelines ruff --fix pipelines
