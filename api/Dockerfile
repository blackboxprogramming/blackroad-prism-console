# --- base: python + node ---
FROM mcr.microsoft.com/devcontainers/python:3.14 as base
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y nodejs jq \
  && npm -v && node -v \
  && apt-get clean && rm -rf /var/lib/apt/lists/*
WORKDIR /workspace
COPY pyproject.toml ./
RUN pip install -U pip && pip install -e . || true

# --- website deps ---
FROM base as webdeps
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN if [ -f package-lock.json ]; then npm install --omit=dev; \
    elif [ -f yarn.lock ]; then npm i -g yarn && yarn --frozen-lockfile; \
    elif [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i --frozen-lockfile; \
    else npm init -y; fi

# --- runtime build ---
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./ 2>/dev/null || true
RUN [ -f package.json ] && npm install --omit=dev || true
COPY . .
# Uncomment below if you have a build step
# RUN npm run build

# --- final runtime ---
FROM node:22-alpine AS final
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 4000
CMD ["node", "server.mjs"]
