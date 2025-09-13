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
