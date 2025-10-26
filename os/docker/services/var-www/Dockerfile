FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server ./server
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 9000

CMD ["/app/start.sh"]
