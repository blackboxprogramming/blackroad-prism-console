FROM python:3.11-slim

ENV POETRY_VERSION=1.8.2
WORKDIR /app

RUN pip install --no-cache-dir "poetry==${POETRY_VERSION}"

COPY pyproject.toml ./
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --only main

COPY . .

EXPOSE 4001

CMD ["poetry", "run", "uvicorn", "roadview.main:app", "--host", "0.0.0.0", "--port", "4001"]
