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
        sudo ln -sf $(CURDIR)/config/nginx/http.conf /etc/nginx/conf.d/llm-http.conf

## reload nginx after config changes
nginx-reload:
	sudo nginx -t
	sudo systemctl reload nginx

.PHONY: gm-install gm-doctor sv4d2 sv4d sv3d_u sv3d_p demo-svd demo-sv3d demo-turbo weights-%

VIDEO ?= path/to/video.mp4
IMAGE ?= path/to/image.png

## install Stability AI generative models stack and gm helper
gm-install:
	bash codex/jobs/setup-stability-generative-models.sh install

## run gm doctor to verify setup
gm-doctor:
	gm doctor

## generate 4D output from a video using SV4D 2.0
sv4d2:
	gm sv4d2 --input_path $(VIDEO)

## generate 4D output from a video using the original SV4D pipeline
sv4d:
	gm sv4d --input_path $(VIDEO)

## create multi-view orbit video from an image using SV3D_u
sv3d_u:
	gm sv3d_u --input_path $(IMAGE)

## create multi-view orbit video from an image using SV3D_p
sv3d_p:
	gm sv3d_p --input_path $(IMAGE)

## launch the SVD demo UI
demo-svd:
	gm demo svd

## launch the SV3D demo UI
demo-sv3d:
	gm demo sv3d

## launch the SDXL-Turbo demo UI
demo-turbo:
	gm demo turbo

## download model weights with gm (e.g. make weights-sv4d2)
weights-%:
	gm weights $*

.PHONY: bootstrap fmt lint type test cov fix review gen docs
bootstrap: ; pip install -U pip pre-commit && pre-commit install
fmt: ; black .
lint: ; ruff check .
type: ; mypy .
test: ; pytest -q
cov: ; pytest --cov --cov-report=term-missing
fix: fmt lint
review: ; python scripts/ai_review.py --diff
gen: ; python scripts/ai_codegen.py --task "$(t)"
docs: ; python scripts/ai_docs.py --from-diff
