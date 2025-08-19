FILE: Dockerfile

Multi-stage, Node 18 Alpine

FROM node:18-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./ 2>/dev/null || true
RUN [ -f package.json ] && npm ci || true
COPY . .

# If you have a build step, enable: RUN npm run build
If you have a build step, enable: RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S lucidia -u 1001
ENV NODE_ENV=production PORT=8000
COPY --from=builder /app /app
USER lucidia
EXPOSE 8000

# Adjust entrypoint if your app uses a server wrapper
Adjust entrypoint if your app uses a server wrapper

CMD ["node", "src/comprehensive-lucidia-system.js"]
# Multi-stage SPA builder
FROM node:22-alpine AS build
WORKDIR /app
COPY sites/blackroad ./sites/blackroad
RUN cd sites/blackroad && npm ci || npm i --package-lock-only && npm run build

FROM caddy:2.8-alpine
COPY --from=build /app/sites/blackroad/dist /srv
COPY sites/blackroad/Caddyfile /etc/caddy/Caddyfile
