COMPOSE=docker compose -f docker-compose.yml -p blackroads
PGPASSWORD=$(shell cat docker/secrets/postgres_password.txt)

.PHONY: up down logs init ingest flow-run dbt-run dbt-test dbt-docs validate fmt

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
