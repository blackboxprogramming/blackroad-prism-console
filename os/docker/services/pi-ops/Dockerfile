FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 7000

CMD ["/app/start.sh"]
WORKDIR /app
COPY pi_ops /app
RUN apt-get update && apt-get install -y --no-install-recommends sqlite3 && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir fastapi uvicorn paho-mqtt
EXPOSE 7000
HEALTHCHECK CMD curl -fsS http://localhost:7000/health || exit 1
CMD ["bash","-lc","uvicorn app:app --host 0.0.0.0 --port 7000"]
