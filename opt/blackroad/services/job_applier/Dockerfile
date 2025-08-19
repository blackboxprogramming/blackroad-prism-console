FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive \
    PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=9301 \
    AIHAWK_REPO_URL="https://github.com/feder-cr/Jobs_Applier_AI_Agent_AIHawk" \
    AIHAWK_BRANCH="main" \
    AIHAWK_DIR="/opt/aih/aih" \
    JOB_APPLIER_DATA_DIR="/data" \
    JOB_APPLIER_LOG_DIR="/logs" \
    CHROME_BIN="/usr/bin/chromium" \
    CHROMEDRIVER_PATH="/usr/bin/chromedriver" \
    AIHAWK_RUN_CMD="" \
    AIHAWK_DRY_RUN="true"

# System deps (git + Chrome + chromedriver + fonts)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl ca-certificates chromium chromium-driver fonts-liberation xvfb \
 && rm -rf /var/lib/apt/lists/*

# App deps
WORKDIR /app
COPY ./requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

# Pull AIHawk at build (will be refreshed again at runtime)
RUN mkdir -p /opt/aih && \
    git clone --depth=1 --branch "${AIHAWK_BRANCH}" "${AIHAWK_REPO_URL}" "${AIHAWK_DIR}" || true && \
    if [ -f "${AIHAWK_DIR}/requirements.txt" ]; then pip install -r "${AIHAWK_DIR}/requirements.txt"; fi

# App code
COPY ./app /app/app
COPY ./entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Non-root
RUN useradd -m -u 10001 appuser
USER appuser

VOLUME ["/data", "/logs"]
EXPOSE 9301
HEALTHCHECK --interval=30s --timeout=5s --retries=5 \
  CMD python - <<'PY' || exit 1
import sys, json, urllib.request
try:
    with urllib.request.urlopen("http://127.0.0.1:9301/health", timeout=3) as r:
        sys.exit(0 if json.load(r).get("ok") else 1)
except Exception:
    sys.exit(1)
PY

ENTRYPOINT ["/app/entrypoint.sh"]
