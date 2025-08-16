# Multi-stage SPA builder
FROM node:22-alpine AS build
WORKDIR /app
COPY sites/blackroad ./sites/blackroad
RUN cd sites/blackroad && npm ci || npm i --package-lock-only && npm run build

FROM caddy:2.8-alpine
COPY --from=build /app/sites/blackroad/dist /srv
COPY sites/blackroad/Caddyfile /etc/caddy/Caddyfile
