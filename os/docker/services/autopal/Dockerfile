FROM python:3.11-slim
WORKDIR /app
COPY services/autopal/app /app
RUN pip install --no-cache-dir fastapi uvicorn pydantic[dotenv] httpx
EXPOSE 8001
HEALTHCHECK CMD curl -fsS http://localhost:8001/health || exit 1
CMD ["bash","-lc","uvicorn app.main:app --host 0.0.0.0 --port 8001"]
