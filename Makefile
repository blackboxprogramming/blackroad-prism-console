.RECIPEPREFIX = >
.PHONY: install dev start format lint test health migrate clean dist tag demo

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

VERSION := $(shell python -m cli.console version:show | head -n 1)


dist:
>mkdir -p dist
>tar -czf dist/prism-console-$(VERSION).tar.gz --exclude=dist --exclude=.git -C . .
>sha256sum dist/* > dist/checksums.txt

tag:
>@git rev-parse --git-dir >/dev/null 2>&1 && git tag v$(VERSION) || echo "git not available"

demo:
>sh scripts/demo.sh
