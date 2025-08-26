# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
# common build dependencies
RUN apk add --no-cache python3 make g++

# ----- Backend stage -----
FROM base AS backend
WORKDIR /srv/blackroad-api
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend ./
COPY server_full.js ./
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "server_full.js"]

# ----- Frontend stage -----
FROM base AS frontend
WORKDIR /var/www/blackroad
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
RUN npm run build
ENV NODE_ENV=production
EXPOSE 5173
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "5173"]

