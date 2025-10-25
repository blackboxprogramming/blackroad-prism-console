# BlackRoad API Bridge — production image
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production PORT=4000
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY server.mjs healthcheck.mjs telemetry.mjs ./
RUN npm install --omit=dev
COPY server.mjs healthcheck.mjs ./

# tiny runtime
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=4000
COPY --from=base /app /app
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --retries=5 CMD node /app/healthcheck.mjs || exit 1
CMD ["node","/app/server.mjs"]
