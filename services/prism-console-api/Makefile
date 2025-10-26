.PHONY: dev lint type test contract openapi

dev:
poetry run uvicorn prism.main:app --reload --port $${PRISM_PORT:-4000}

lint:
poetry run ruff check src tests

type:
poetry run mypy src

test:
poetry run pytest --maxfail=1 --disable-warnings --cov=src/prism --cov-report=term-missing

openapi:
poetry run python -m scripts.export_openapi
