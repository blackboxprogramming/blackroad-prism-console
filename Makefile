.RECIPEPREFIX = >
.PHONY: setup test lint demo validate dc-up dc-test dc-shell build run deploy preview-destroy notify

setup:
>python -m venv .venv && . .venv/bin/activate && pip install -U pip pytest jsonschema ruff

test:
>. .venv/bin/activate && pytest

lint:
>. .venv/bin/activate && ruff .

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
