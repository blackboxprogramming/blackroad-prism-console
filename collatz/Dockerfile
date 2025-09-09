# Multi-arch Python base; works on x86_64, arm64, aarch64 (Jetson/RPi)
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY collatz ./collatz
COPY scripts ./scripts
COPY collatz/config.yaml ./collatz/config.yaml
CMD ["bash", "scripts/run_local.sh"]
