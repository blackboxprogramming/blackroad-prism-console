# syntax=docker/dockerfile:1
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build:prod

FROM node:20-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s CMD node -e "http=require('http');r=http.request({host:'127.0.0.1',port:8000,path:'/ready',timeout:2000},res=>{process.exit(res.statusCode===200?0:1)});r.on('error',()=>process.exit(1));r.end();"
CMD ["node", "dist/comprehensive-lucidia-system.js"]
