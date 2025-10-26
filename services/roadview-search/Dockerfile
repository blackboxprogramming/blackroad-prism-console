FROM python:3.11-slim

ENV POETRY_HOME=/opt/poetry \
    POETRY_VERSION=1.7.1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on

RUN apt-get update && apt-get install -y --no-install-recommends build-essential curl && rm -rf /var/lib/apt/lists/*
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="$POETRY_HOME/bin:$PATH"

WORKDIR /app
COPY pyproject.toml README.md Makefile .env.example ./
COPY src ./src
COPY fixtures ./fixtures
COPY scripts ./scripts
COPY docs ./docs

RUN poetry config virtualenvs.create false && poetry install --without dev --no-interaction --no-ansi

EXPOSE 4001

CMD ["uvicorn", "src.roadview.main:app", "--host", "0.0.0.0", "--port", "4001"]
