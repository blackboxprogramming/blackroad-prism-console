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

RUN addgroup -S nodejs -g 1001 \
  && adduser -S -G nodejs -u 1001 -h /home/lucidia lucidia \
  && chown -R lucidia:nodejs /app

USER lucidia
EXPOSE 8000
CMD ["npm", "run", "dev"]
