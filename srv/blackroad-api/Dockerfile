FROM node:18

WORKDIR /srv/blackroad-api

RUN apt-get update \
 && apt-get install -y sqlite3 \
 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install
COPY . .
RUN npm test

EXPOSE 4000
CMD ["npm", "start"]

