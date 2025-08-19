.PHONY: dev test build run batch tune fmt lint

dev: fmt lint test
	@docker compose up --build

build:
	@docker compose build

run:
	@docker compose up -d

batch:
	@python pipelines/batch/run_batch.py --input ./data/input --output ./data/output

tune:
	@python pipelines/tuning/hpo.py --trials 5

test:
	@pytest var/www/blackroad || true

fmt:
	@black backend pipelines || true

lint:
	@flake8 backend pipelines || true
