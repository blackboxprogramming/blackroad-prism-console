FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# System deps kept minimal
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Python deps (CPU-only Torch via sentence-transformers)
RUN pip install --no-cache-dir \
    fastapi uvicorn[standard] pydantic==2.* \
    sentence-transformers qdrant-client numpy \
    python-multipart \
    pypdf python-docx python-pptx beautifulsoup4

# App
WORKDIR /app
COPY ./app /app/app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host","0.0.0.0","--port","8000"]
