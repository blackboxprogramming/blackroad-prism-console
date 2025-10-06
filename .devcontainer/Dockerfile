FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    build-essential \
    python3-pip \
    python3-venv \
    jq \
    unzip \
    make \
    pkg-config \
    libsqlite3-dev \
  && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir awscli-local
