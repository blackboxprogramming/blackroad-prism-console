FROM python:3.11-slim
WORKDIR /app
COPY opt/blackroad /app
RUN pip install --no-cache-dir fastapi uvicorn
EXPOSE 8000
HEALTHCHECK CMD curl -fsS http://localhost:8000/health || exit 1
CMD ["/bin/sh","-lc","python -c 'import os;print(\"BlackRoad API container\")' && uvicorn main:app --host 0.0.0.0 --port 8000"]
