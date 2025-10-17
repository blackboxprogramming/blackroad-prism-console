SHELL := /bin/bash
ENV ?= .env

.PHONY: install schema seed clean

install:
	@[ -f package-lock.json ] || npm i --package-lock-only
	npm ci

schema:
	@[ -f $(ENV) ] || (echo "Missing $(ENV)"; exit 1)
	source $(ENV); npm run schema

seed:
	@[ -f $(ENV) ] || (echo "Missing $(ENV)"; exit 1)
	source $(ENV); npm run seed

clean:
	rm -rf node_modules
