FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server ./server
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 9000

CMD ["/app/start.sh"]
WORKDIR /app
COPY var/www/blackroad/server /app
# If package.json exists, use it; else install minimal deps
RUN [ -f package.json ] && npm ci || (npm init -y && npm i express cors)
EXPOSE 9000
HEALTHCHECK CMD wget -qO- http://localhost:9000/health >/dev/null || exit 1
CMD ["node","index.js"]
