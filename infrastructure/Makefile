SHELL := /bin/bash
COMPOSE := docker-compose.yml
AIRGAP_DIR := ../airgap

.PHONY: bootstrap build airgap push-local up down promote drill-failover drill-multi-region

bootstrap:
	../ops/scripts/seed.sh ../ops/seed-manifest.yaml

build:
	docker compose -f $(COMPOSE) build

airgap:
	../ops/scripts/airgap.sh $(AIRGAP_DIR)

push-local:
	docker compose -f $(COMPOSE) push

up:
	docker compose -f $(COMPOSE) up -d

down:
	docker compose -f $(COMPOSE) down

promote:
	../ops/scripts/promote.sh

drill-failover:
	../ops/scripts/drill-failover.sh

drill-multi-region:
	../ops/scripts/drill-multi-region.sh
