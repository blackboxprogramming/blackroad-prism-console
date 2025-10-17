.RECIPEPREFIX = >
.PHONY: setup test lint demo validate dc-up dc-test dc-shell build run deploy preview-destroy notify lint-observability
.PHONY: setup test lint demo validate dc-up dc-test dc-shell build run deploy preview-destroy mpm-core energy
.PHONY: setup test lint demo validate dc-up dc-test dc-shell build run deploy preview-destroy docs

setup:
>python -m venv .venv && . .venv/bin/activate && pip install -U pip pytest jsonschema ruff

test:
>. .venv/bin/activate && pytest

lint:
>. .venv/bin/activate && ruff .

lint-observability:
>python -m observability.lint

validate:
>. .venv/bin/activate && python scripts/validate_contracts.py

notify:
>cd compliance && SLACK_WEBHOOK_URL="$(SLACK_WEBHOOK_URL)" go run ./cmd/harness test:mirror

demo:
>brc plm:items:load --dir fixtures/plm/items && \
>brc plm:bom:load --dir fixtures/plm/boms && \
>brc plm:bom:explode --item PROD-100 --rev A --level 3 && \
>brc mfg:wc:load --file fixtures/mfg/work_centers.csv && \
>brc mfg:routing:load --dir fixtures/mfg/routings && \
>brc mfg:routing:capcheck --item PROD-100 --rev B --qty 1000 && \
>brc mfg:wi:render --item PROD-100 --rev B && \
>brc mfg:spc:analyze --op OP-200 --window 50 && \
>brc mfg:yield --period 2025-09 && \
>brc mfg:mrp --demand artifacts/sop/allocations.csv --inventory fixtures/mfg/inventory.csv --pos fixtures/mfg/open_pos.csv && \
>brc mfg:coq --period 2025-Q3

build:
>docker build -t blackroad/prism-console:dev -f Dockerfile .

run:
>docker compose up --build app

deploy:
>@test -n "$(PR)" || (echo "PR=<number> is required" >&2 && exit 1)
>PR_NUMBER=$(PR) PROJECT_NAME=prism-console scripts/devx/deploy_preview.sh apply

preview-destroy:
>@test -n "$(PR)" || (echo "PR=<number> is required" >&2 && exit 1)
>PR_NUMBER=$(PR) PROJECT_NAME=prism-console scripts/devx/deploy_preview.sh destroy

dc-up:
>docker compose up --build app

dc-test:
>docker compose run --rm tests

dc-shell:
>docker compose run --rm app bash
.PHONY: install dev start format lint test health migrate clean

install:
>npm install

dev:
>npm run dev

start:
>npm start

format:
>npm run format

lint:
>npm run lint

test:
>npm test

health:
>npm run health

migrate:
>@echo "no migrations"

clean:
>rm -rf node_modules coverage

analysis:
>python analysis/run_all.py

samples:
>python -m cli.console samples:gen --overwrite

goldens:
>python scripts/update_goldens.py

mpm-core:
>python 20_bench_solid/taichi_mpm_core.py

energy:
>python 40_compare/plot_energy.py
.PHONY: install figures ops

install:
	python -m pip install -r requirements.txt

figures: install
	python analysis/tap_null_isi.py
	python analysis/selectors_autocorr.py
	python analysis/variance_surfaces.py
	python analysis/nphase_weierstrass.py

ops:
	curl -fsS http://localhost/health && echo OK || (echo FAIL && exit 1)
	curl -fsS http://localhost/api/health && echo OK || true
	curl -fsS http://localhost/api/ops || true

docs:
>cd compliance && go run ./cmd/ruledocs ../rules ../docs/rules
