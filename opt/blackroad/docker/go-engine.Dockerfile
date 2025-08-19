FROM debian:12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential git python3 python3-pip ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Build Pachi
RUN git clone https://github.com/pasky/pachi /opt/pachi && \
    make -C /opt/pachi && \
    ln -s /opt/pachi/pachi /usr/local/bin/pachi

# App
WORKDIR /app
COPY agents /app/agents
COPY services /app/services
RUN pip3 install fastapi uvicorn pydantic

ENV PYTHONPATH=/app
EXPOSE 8088

HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD \
  python3 - <<'PY' || exit 1
import urllib.request,sys
try:
  urllib.request.urlopen('http://127.0.0.1:8088/api/go/health',timeout=2)
except Exception as e:
  sys.exit(1)
PY

CMD ["uvicorn", "services.go_service:app", "--host", "0.0.0.0", "--port", "8088"]
