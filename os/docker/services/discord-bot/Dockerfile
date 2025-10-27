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
WORKDIR /app

COPY services/discord-bot/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY services/discord-bot/src/ ./
COPY os/docker/services/discord-bot/start.sh ./start.sh
COPY os/docker/services/discord-bot/healthcheck.py ./healthcheck.py
RUN chmod +x ./start.sh

CMD ["./start.sh"]
