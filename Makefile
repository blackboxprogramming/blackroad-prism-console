PYENV      := /opt/pyml
COMPOSE    := /srv/llm/docker-compose.yml
NGINX_CONF := /etc/nginx/sites-available/llm.conf

.PHONY: venv llm-up llm-down llm-restart llm-logs torch-check vllm-chat nginx-link nginx-reload

## create / update Python venv at $(PYENV)
venv:
	@test -d $(PYENV) || python3 -m venv $(PYENV)
	@$(PYENV)/bin/pip install --upgrade pip wheel setuptools

## bring up vLLM, OpenWebUI, Ollama
llm-up:
	docker compose -f $(COMPOSE) up -d

## stop and remove LLM services
llm-down:
	docker compose -f $(COMPOSE) down

## restart LLM services
llm-restart:
	docker compose -f $(COMPOSE) restart

## follow logs from LLM services
llm-logs:
	docker compose -f $(COMPOSE) logs -f

## quick torch sanity check (prints version and CUDA availability)
torch-check:
	$(PYENV)/bin/python - <<'PY'
import torch
print("torch", torch.__version__)
print("cuda available:", torch.cuda.is_available())
PY

## sample vLLM chat request
vllm-chat:
	curl -s http://localhost:8000/v1/chat/completions \
	  -H 'Content-Type: application/json' \
	  -d '{"model":"facebook/opt-125m","messages":[{"role":"user","content":"Hello!"}]}' \
	  | jq '.choices[0].message.content'

## link nginx config and enable site
nginx-link:
	sudo ln -sf $(CURDIR)/config/nginx/llm.conf $(NGINX_CONF)
	sudo ln -sf $(NGINX_CONF) /etc/nginx/sites-enabled/llm.conf

## reload nginx after config changes
nginx-reload:
	sudo nginx -t
	sudo systemctl reload nginx
