.PHONY: dev build site up lint format
dev:
	cd sites/blackroad && npm run dev
build:
	cd sites/blackroad && npm run build
site:
	xdg-open http://localhost:5173 || open http://localhost:5173 || true
up:
	docker compose up --build -d
lint:
	npm run lint
format:
	npm run format
