FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 8000

CMD ["/app/start.sh"]
WORKDIR /app
COPY services/autopal/app /app
RUN pip install --no-cache-dir fastapi uvicorn pydantic[dotenv] httpx
EXPOSE 8001
HEALTHCHECK CMD curl -fsS http://localhost:8001/health || exit 1
CMD ["bash","-lc","uvicorn app.main:app --host 0.0.0.0 --port 8001"]
