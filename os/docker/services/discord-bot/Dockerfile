FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY bot.py ./bot.py
COPY healthcheck.py ./healthcheck.py
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

CMD ["/app/start.sh"]
