FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* tsconfig.json ./
RUN npm install --production=false || npm install --production=false

COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/package.json ./
COPY --from=base /app/package-lock.json* ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist

CMD ["node", "dist/index.js"]
