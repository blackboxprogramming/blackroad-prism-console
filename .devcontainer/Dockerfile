FROM mcr.microsoft.com/devcontainers/base:jammy

RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    python3-pip \
    jq \
    unzip \
    make \
  && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir awscli-local
