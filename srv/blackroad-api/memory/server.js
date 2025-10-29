const { createMemoryApp } = require('./app');

const PORT = process.env.PORT || 3000;
const { app, store } = createMemoryApp();

let server;

store.ready
  .then(() => {
    server = app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Memory API listening on port ${PORT} (db: ${store.dbPath})`);
    });
  })
  .catch(err => {
    // eslint-disable-next-line no-console
    console.error('Failed to initialise memory store', err);
    process.exit(1);
  });

async function shutdown() {
  try {
    await store.close();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error while closing memory store', err);
  }
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
'use strict';

const path = require('path');
const http = require('http');

const { createMemoryApp } = require('./app');
const { MemoryStore } = require('./store');
const { MemoryPersister } = require('./persister');
const { WebDavClient } = require('./webdav');

const DEFAULT_DB_PATH = process.env.MEMORY_DB_PATH || '/srv/blackroad-api/memory.db';
const DEFAULT_FALLBACK_PATH = process.env.MEMORY_FALLBACK_PATH || path.resolve('/home/agents/cecilia/logs/memory.txt');
const WEB_DAV_BASE_URL = process.env.WEBDAV_URL || 'http://192.168.4.55:8080/agents/cecilia/memory/';
const WEB_DAV_USER = process.env.WEBDAV_USER || 'mobile';
const WEB_DAV_PASS = process.env.WEBDAV_PASS || process.env.WEBDAV_PASSWD || null;
const WEB_DAV_TIMEOUT_MS = Number(process.env.WEBDAV_TIMEOUT_MS || 7000);
const PORT = Number(process.env.PORT || 3000);

function createServices() {
  const store = new MemoryStore(DEFAULT_DB_PATH);
  const webdavClient = WEB_DAV_PASS
    ? new WebDavClient({
        baseUrl: WEB_DAV_BASE_URL,
        username: WEB_DAV_USER,
        password: WEB_DAV_PASS,
        timeoutMs: WEB_DAV_TIMEOUT_MS,
      })
    : null;
  const persister = new MemoryPersister({
    store,
    webdavClient,
    flatFilePath: DEFAULT_FALLBACK_PATH,
  });

  return { store, webdavClient, persister };
}

async function start() {
  const { store, webdavClient, persister } = createServices();
  const app = createMemoryApp({ store, persister, webdavClient });
  const server = http.createServer(app);

  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(
      `Memory API listening on port ${PORT} (db: ${DEFAULT_DB_PATH}, webdav: ${webdavClient ? webdavClient.baseUrl : 'disabled'})`
    );
  });

  const shutdown = (signal) => {
    // eslint-disable-next-line no-console
    console.log(`Received ${signal}. Shutting down Memory API.`);
    server.close(() => {
      store.close();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return server;
}

if (require.main === module) {
  start().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start Memory API server', error);
    process.exit(1);
  });
}

module.exports = {
  start,
  createServices,
};
