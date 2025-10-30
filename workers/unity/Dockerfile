FROM node:20-alpine

RUN apk add --no-cache zip

WORKDIR /app

RUN apk add --no-cache zip

COPY package.json ./
RUN npm install --production
COPY server.js ./
COPY template ./template
RUN npm install

COPY server.js ./
COPY template ./template
COPY README.md ./README.md

EXPOSE 3000
CMD ["node", "server.js"]
