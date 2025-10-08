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
    curl \
  && rm -rf /var/lib/apt/lists/*

# Install AWS Session Manager plugin
RUN curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/ubuntu_64bit/session-manager-plugin.deb" -o "session-manager-plugin.deb" \
  && dpkg -i session-manager-plugin.deb \
  && rm session-manager-plugin.deb

RUN pip3 install --no-cache-dir awscli-local
