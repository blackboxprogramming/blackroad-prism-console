PNPM ?= pnpm

.PHONY: install dev lint typecheck test coverage build start storybook storybook-build e2e ci

install:
$(PNPM) install

dev:
$(PNPM) dev

lint:
$(PNPM) lint

typecheck:
$(PNPM) typecheck

test:
$(PNPM) test

coverage:
$(PNPM) coverage

build:
$(PNPM) build

start:
$(PNPM) start

storybook:
$(PNPM) storybook

storybook-build:
$(PNPM) storybook:build

e2e:
$(PNPM) e2e

ci:
$(PNPM) lint && $(PNPM) typecheck && $(PNPM) test && $(PNPM) build && $(PNPM) storybook:build && $(PNPM) e2e
