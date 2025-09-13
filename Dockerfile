FROM python:3.11 as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app
COPY --from=builder /usr/local /usr/local
COPY . /app
RUN useradd -m appuser
USER appuser
ENTRYPOINT ["python", "-m", "cli.console"]
