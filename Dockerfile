# Base dependencies
FROM node:20-bookworm-slim AS base
WORKDIR /app
COPY package.json* pnpm-lock.yaml* yarn.lock* package-lock.json* ./
RUN corepack enable

# Development environment
FROM base AS dev
ENV NODE_ENV=development
RUN if [ -f package-lock.json ]; then npm install; \
    elif [ -f pnpm-lock.yaml ]; then corepack prepare pnpm@latest --activate && pnpm install; \
    elif [ -f yarn.lock ]; then yarn install; \
    else npm install; fi
COPY . .
CMD ["npm", "run", "dev"]

# Build for production
FROM base AS build
ENV NODE_ENV=production
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; \
    elif [ -f pnpm-lock.yaml ]; then corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    else npm install --no-audit --no-fund; fi
COPY . .
RUN npm run build --if-present

# Production runtime
FROM node:20-bookworm-slim AS production
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app .
EXPOSE 3000
CMD ["npm", "start"]
