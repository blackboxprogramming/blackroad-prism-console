FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN pip install --upgrade pip && pip install poetry

COPY pyproject.toml poetry.lock* ./
RUN poetry config virtualenvs.create false && poetry install --no-root --no-dev

COPY src ./src
COPY .env.example ./

EXPOSE 8082

CMD ["uvicorn", "auth.main:app", "--host", "0.0.0.0", "--port", "8082"]
