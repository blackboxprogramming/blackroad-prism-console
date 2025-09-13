.RECIPEPREFIX = >
.PHONY: install dev start jsformat lint test health migrate clean analysis format coverage

install:
>npm install

dev:
>npm run dev

start:
>npm start

jsformat:
>npm run format

format:
>python - <<'PY'
print('No external formatter by policy; keep deterministic ordering.')
PY

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

coverage:
>pytest --maxfail=1 --disable-warnings -q --cov=. --cov-report=term-missing
