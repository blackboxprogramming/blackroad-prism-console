FROM node:20-bookworm-slim
WORKDIR /app
COPY server/package*.json ./server/
RUN npm --prefix server ci
COPY server ./server
RUN npm --prefix server run build
CMD ["node", "server/dist/index.js"]
