.PHONY: install verify scan start-llm

install:
	bash ops/install.sh

verify:
	bash tools/verify-runtime.sh

scan:
	node tools/dep-scan.js --dir ./srv/blackroad-api

start-llm:
	cd srv/lucidia-llm && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt && uvicorn app:app --host 127.0.0.1 --port 8000
