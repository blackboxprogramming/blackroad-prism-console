FROM python:3.11-slim

WORKDIR /app

RUN pip install poetry
COPY pyproject.toml README.md /app/
RUN poetry config virtualenvs.create false && poetry install --no-dev

COPY src /app/src
COPY docs /app/docs

ENV ROADGLITCH_PORT=8080
CMD ["poetry", "run", "uvicorn", "roadglitch.main:app", "--host", "0.0.0.0", "--port", "8080"]

