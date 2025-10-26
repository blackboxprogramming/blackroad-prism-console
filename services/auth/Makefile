.PHONY: dev lint type test contract build run openapi

POETRY=poetry

dev:
$(POETRY) run uvicorn auth.main:app --reload --port $$AUTH_PORT

lint:
$(POETRY) run ruff check src

type:
$(POETRY) run mypy src

test:
$(POETRY) run pytest -q --maxfail=1 --disable-warnings --cov=src/auth --cov-report=term-missing

contract:
$(POETRY) run python -m scripts.export_openapi
$(POETRY) run schemathesis run http://localhost:8082/openapi.json --checks all --hypothesis-max-examples 20

build:
docker build -t blackroad-auth:dev .

run:
docker-compose -f docker-compose.dev.yml up --build

openapi:
$(POETRY) run python -m scripts.export_openapi
