FROM node:20-bookworm-slim

# System deps for native addons (sharp/canvas etc.)
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    ca-certificates python3 make g++ libvips libvips-dev \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

# Use pnpm/yarn/npm based on the lockfile you have
COPY package.json* pnpm-lock.yaml* yarn.lock* package-lock.json* ./
RUN corepack enable && \
    if [ -f pnpm-lock.yaml ]; then corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci --no-audit --no-fund; \
    else npm install --no-audit --no-fund; fi

COPY . .

# Build if build script exists
RUN node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts.build ? 0 : 1)" \
  && (npm run build || yarn build || pnpm build) || echo "No build script, skipping."

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=5 CMD curl -f http://localhost:3000/ || exit 1
CMD [ "sh", "-c", "pnpm start || yarn start || npm run start" ]
