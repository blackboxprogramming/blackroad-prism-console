PNPM?=pnpm

.PHONY: install dev lint test build start

install:
$(PNPM) install

dev:
$(PNPM) --filter api-gateway dev

lint:
$(PNPM) --filter api-gateway lint

format:
npx prettier --write src

test:
$(PNPM) --filter api-gateway test

build:
$(PNPM) --filter api-gateway build

start:
$(PNPM) --filter api-gateway start
