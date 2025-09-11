dev: ## run web + server
	pnpm -C apps/web dev & pnpm -C server dev

lint:
	pnpm -r lint

typecheck:
	ts-node --project tsconfig.json -e "console.log('types ok')"

seed:
	node server/scripts/seed-events.mjs
