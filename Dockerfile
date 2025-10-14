# --- base: python + node ---
FROM mcr.microsoft.com/devcontainers/python:3.13 as base
# Includes Debian, git, curl, common build tools

# Node 20 (via NodeSource)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y nodejs \
  && npm -v && node -v

# Poetry optional (not used by default) & jq for scripts
RUN apt-get update && apt-get install -y jq && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
COPY pyproject.toml ./
RUN pip install -U pip && pip install -e . || true

# --- website deps ---
FROM base as webdeps
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
# Choose your PM; default to npm if lock missing
RUN if [ -f package-lock.json ]; then npm ci; \
    elif [ -f yarn.lock ]; then npm i -g yarn && yarn --frozen-lockfile; \
    elif [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i --frozen-lockfile; \
    else npm init -y; fi

# --- runtime ---
FROM base as runtime
# Multi-stage, Node 22 Alpine

FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./ 2>/dev/null || true
RUN [ -f package.json ] && npm ci || true
COPY . .

# If you have a build step, enable: RUN npm run build
# If you have a build step, enable: RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S lucidia -u 1001
ENV NODE_ENV=production PORT=8000
COPY --from=builder /app /app
USER lucidia
EXPOSE 8000

# Adjust entrypoint if your app uses a server wrapper
# Adjust entrypoint if your app uses a server wrapper

CMD ["node", "src/comprehensive-lucidia-system.js"]
# Multi-stage SPA builder
FROM node:22-alpine AS build
WORKDIR /app
COPY sites/blackroad ./sites/blackroad
RUN cd sites/blackroad && npm ci || npm i --package-lock-only && npm run build

FROM caddy:2.8-alpine
COPY --from=build /app/sites/blackroad/dist /srv
COPY sites/blackroad/Caddyfile /etc/caddy/Caddyfile
# syntax=docker/dockerfile:1
# Multi-stage build for Lucidia Cognitive System

ARG NODE_IMAGE=node:22-alpine

# ---------- Builder ----------
FROM ${NODE_IMAGE} AS builder
WORKDIR /app

# Toolchain & headers for native modules (e.g., node-canvas)
RUN apk add --no-cache \
  python3 make g++ \
  cairo-dev pango-dev giflib-dev pixman-dev libjpeg-turbo-dev freetype-dev

# Install ALL deps to build; we'll prune dev deps after build
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copy sources and build
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY config/ ./config/
RUN npm run build:prod

# Drop devDependencies so node_modules is prod-only, with native modules already compiled
RUN npm prune --omit=dev

# ---------- Production ----------
FROM ${NODE_IMAGE} AS production
WORKDIR /app

# Runtime libs only; dumb-init for proper signal handling
RUN apk add --no-cache \
  dumb-init curl ca-certificates tzdata \
  cairo pango giflib pixman libjpeg-turbo freetype

# Non-root user
RUN addgroup -S nodejs -g 1001 \
  && adduser -S -G nodejs -u 1001 -h /home/lucidia lucidia

# Environment
ENV NODE_ENV=production \
    PORT=8000 \
    LUCIDIA_LOG_LEVEL=info \
    LUCIDIA_DATA_DIR=/app/data \
    LUCIDIA_LOG_DIR=/app/logs

# Copy built artifacts from builder
COPY --from=builder --chown=lucidia:nodejs /app/dist ./dist
COPY --from=builder --chown=lucidia:nodejs /app/node_modules ./node_modules
COPY --chown=lucidia:nodejs config/ ./config/
COPY --chown=lucidia:nodejs scripts/healthcheck.js ./scripts/healthcheck.js
COPY --chown=lucidia:nodejs package*.json ./

# App dirs
RUN mkdir -p /app/logs /app/data && chown -R lucidia:nodejs /app

USER lucidia
EXPOSE 8000

# Health check (script exits nonzero on failure)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD ["node", "/app/scripts/healthcheck.js"]

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/comprehensive-lucidia-system.js"]

# ---------- Development ----------
FROM ${NODE_IMAGE} AS development
WORKDIR /app

RUN apk add --no-cache \
  python3 make g++ \
  cairo-dev pango-dev giflib-dev pixman-dev libjpeg-turbo-dev freetype-dev

COPY package*.json ./
RUN npm install
COPY . .
# Install Python test deps
RUN pip install -U pytest jsonschema
# Install web deps by copying from webdeps if present
COPY --from=webdeps /workspace/node_modules /workspace/node_modules

# Build site (optional; dev server uses on-demand build)
RUN npm run build --if-present || true

EXPOSE 3000
CMD ["bash", "-lc", "echo 'Dev container ready. Use: npm run dev (website) | pytest | brc ...'"]
FROM python:3.11-slim AS builder
WORKDIR /app
COPY dist/wheels /wheels
RUN python -m venv /venv \
    && /venv/bin/pip install --no-index --find-links /wheels blackroad-prism-console

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /venv /venv
COPY dist/SBOM.spdx.json dist/SBOM.spdx.json
LABEL org.opencontainers.image.revision="unknown" \
      org.opencontainers.image.version="0.1.0" \
      sbom="/app/dist/SBOM.spdx.json"
ENV PATH=/venv/bin:$PATH
CMD ["python", "-m", "cli.console", "--help"]
