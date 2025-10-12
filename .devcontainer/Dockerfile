# Use a supported base so features work
FROM mcr.microsoft.com/devcontainers/base:ubuntu

# OS deps you actually need (example)
RUN apt-get update \
 && apt-get install -y git-lfs \
 && rm -rf /var/lib/apt/lists/*
