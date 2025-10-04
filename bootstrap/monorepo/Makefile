SHELL := /bin/bash

NPM ?= npm
DOCKER ?= docker

COMPOSE_FILE := docker-compose.devnet.yml

.PHONY: install install-web install-contracts lint lint-web lint-contracts test test-web test-contracts \
devnet-up devnet-down devnet-logs roadweb-dev roadweb-build contracts-build contracts-test \
contracts-test-foundry contracts-lint contracts-slither clean format

install: install-web install-contracts ## Install dependencies for web + contracts

install-web:
	$(NPM) --prefix apps/roadweb install

install-contracts:
	$(NPM) --prefix packages/roadcoin install

lint: lint-web lint-contracts ## Run all linters

lint-web:
	$(NPM) --prefix apps/roadweb run lint

lint-contracts:
	$(NPM) --prefix packages/roadcoin run lint

format:
	$(NPM) --prefix apps/roadweb run format && \
	$(NPM) --prefix packages/roadcoin run format

test: test-web test-contracts ## Run all tests

test-web:
	$(NPM) --prefix apps/roadweb run test

contracts-build:
	$(NPM) --prefix packages/roadcoin run build

test-contracts: contracts-build contracts-test contracts-test-foundry

contracts-test:
	$(NPM) --prefix packages/roadcoin run test

contracts-test-foundry:
	$(NPM) --prefix packages/roadcoin run test:foundry

contracts-lint:
	$(NPM) --prefix packages/roadcoin run lint

contracts-slither:
	$(NPM) --prefix packages/roadcoin run slither

devnet-up:
	$(DOCKER) compose -f $(COMPOSE_FILE) up --detach --build

devnet-down:
	$(DOCKER) compose -f $(COMPOSE_FILE) down --remove-orphans --volumes

devnet-logs:
	$(DOCKER) compose -f $(COMPOSE_FILE) logs -f

roadweb-dev:
	$(NPM) --prefix apps/roadweb run dev

roadweb-build:
	$(NPM) --prefix apps/roadweb run build

clean:
	rm -rf apps/roadweb/node_modules apps/roadweb/dist
	rm -rf packages/roadcoin/node_modules packages/roadcoin/cache packages/roadcoin/artifacts \
		packages/roadcoin/out packages/roadcoin/coverage
