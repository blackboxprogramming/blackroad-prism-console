PNPM?=pnpm

.PHONY: install dev lint test build storybook e2e mocks

install:
$(PNPM) install

dev:
$(PNPM) --filter prism-console-web dev

lint:
$(PNPM) --filter prism-console-web lint

format:
$(PNPM) --filter prism-console-web format

test:
$(PNPM) --filter prism-console-web test

build:
$(PNPM) --filter prism-console-web build

storybook:
$(PNPM) --filter prism-console-web storybook

e2e:
$(PNPM) --filter prism-console-web e2e

mocks:
node mocks/server.cjs
