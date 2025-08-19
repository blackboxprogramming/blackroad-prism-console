FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libfreetype6-dev libpng-dev && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY sympy_api.py .
EXPOSE 8000
CMD ["uvicorn", "sympy_api:app", "--host", "0.0.0.0", "--port", "8000"]
