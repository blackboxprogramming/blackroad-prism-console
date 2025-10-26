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
COPY opt/blackroad /app
RUN pip install --no-cache-dir fastapi uvicorn
EXPOSE 8000
HEALTHCHECK CMD curl -fsS http://localhost:8000/health || exit 1
CMD ["/bin/sh","-lc","python -c 'import os;print(\"BlackRoad API container\")' && uvicorn main:app --host 0.0.0.0 --port 8000"]
