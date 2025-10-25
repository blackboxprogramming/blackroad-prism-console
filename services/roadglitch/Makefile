.PHONY: dev lint test contract export-openapi build run

POETRY = poetry

install:
$(POETRY) install

dev:
$(POETRY) run uvicorn roadglitch.main:app --reload --host 0.0.0.0 --port 8080

lint:
$(POETRY) run ruff check src
$(POETRY) run mypy src

test:
$(POETRY) run pytest tests/unit tests/integration

contract:
$(POETRY) run pytest tests/contract

export-openapi:
$(POETRY) run python -c "from roadglitch.main import app; import json, pathlib; pathlib.Path('docs').mkdir(exist_ok=True); pathlib.Path('docs/roadglitch-openapi.json').write_text(json.dumps(app.openapi()))"

build:
docker build -t roadglitch:latest .

run:
docker compose -f docker-compose.dev.yml up

