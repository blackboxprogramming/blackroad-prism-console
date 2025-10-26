FROM python:3.11-slim
WORKDIR /app
COPY services/discord-bot/src /app
RUN pip install --no-cache-dir discord.py
COPY os/docker/services/discord-bot/healthcheck.py /app/healthcheck.py
CMD ["bash","-lc","python main.py"]
