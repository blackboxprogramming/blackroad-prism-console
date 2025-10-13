FROM node:20-alpine

RUN apk add --no-cache zip

WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY server.js ./
COPY template ./template

EXPOSE 3000
CMD ["node", "server.js"]
