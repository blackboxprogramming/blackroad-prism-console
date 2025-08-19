# <!-- FILE: /srv/blackroads/elt/docker/pipelines.Dockerfile -->
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential curl postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /srv/blackroads/elt

COPY pipelines/requirements.txt pipelines/requirements.txt
RUN pip install --no-cache-dir -r pipelines/requirements.txt

RUN useradd -ms /bin/bash blackroads
USER blackroads

CMD ["bash"]
