FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# minimal hardening + tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    git ca-certificates build-essential curl tini && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# copy our harness first
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# bring in HumanEval repo (local mirror path overridable)
ARG HUMANEVAL_REPO=https://github.com/openai/human-eval
RUN git clone --depth=1 "$HUMANEVAL_REPO" /app/third_party/human-eval && \
    pip install --no-cache-dir -e /app/third_party/human-eval

# copy the rest
COPY . /app

# default run: generate samples (ollama) then score
ENTRYPOINT ["/usr/bin/tini","--"]
CMD ["bash","-lc","python run_eval.py --config configs/ollama.yaml && evaluate_functional_correctness outputs/latest.samples.jsonl"]
