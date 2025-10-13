FROM node:20-alpine

WORKDIR /app
RUN apk add --no-cache zip

COPY package.json ./
RUN npm install --production

COPY server.js ./server.js
COPY template ./template
COPY README.md ./README.md
COPY TASKS.md ./TASKS.md

EXPOSE 3000
CMD ["node", "server.js"]
