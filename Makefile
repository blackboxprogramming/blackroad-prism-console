.RECIPEPREFIX = >
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
>pytest tests/test_rbac.py tests/test_approvals.py tests/test_audit_signing.py tests/test_cli_rbac_approvals.py -q

health:
>npm run health

migrate:
>@echo "no migrations"

clean:
>rm -rf node_modules coverage

analysis:
>python analysis/run_all.py

build:
>docker build -t prism-console:local .

run:
>docker run --rm -it -v $(pwd)/data:/app/data prism-console:local bot:list
