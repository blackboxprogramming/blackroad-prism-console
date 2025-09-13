# ---- build ----
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json ./tsconfig.json
COPY src ./src
RUN npm run build

# ---- run ----
FROM node:20-slim
ENV NODE_ENV=production
WORKDIR /srv/blackroad-api
COPY --from=build /app/dist ./dist
COPY package.json ./
RUN npm ci --omit=dev && adduser --system --uid 10001 runner
USER runner
EXPOSE 4000
CMD ["node", "dist/server.js"]
