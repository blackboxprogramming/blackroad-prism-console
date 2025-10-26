.PHONY: dev lint type test contract build run openapi

export POETRY := poetry

venv:
$(POETRY) install

dev:
ROADVIEW_PORT=$${ROADVIEW_PORT:-4001} $(POETRY) run uvicorn src.roadview.main:app --reload --port $${ROADVIEW_PORT:-4001}

lint:
$(POETRY) run ruff check .

type:
$(POETRY) run mypy src

test:
$(POETRY) run pytest -q --maxfail=1 --disable-warnings --cov=src --cov-report=term-missing

contract:
$(POETRY) run python -m scripts.export_openapi
$(POETRY) run schemathesis run http://localhost:4001/openapi.json --checks all --hypothesis-max-examples 25

build:
$(POETRY) run docker build -t blackroad-roadview:dev .

run:
docker-compose up --build

openapi:
$(POETRY) run python -m scripts.export_openapi
