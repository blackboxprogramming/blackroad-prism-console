'use strict';

const path = require('path');
const http = require('http');

const { createMemoryApp } = require('./app');
const { MemoryStore, DEFAULT_MEMORY_DB_PATH } = require('./store');
const { MemoryPersister } = require('./persister');
const { WebDavClient } = require('./webdav');

const DEFAULT_DB_PATH = process.env.MEMORY_DB_PATH || DEFAULT_MEMORY_DB_PATH;
const DEFAULT_FALLBACK_PATH = process.env.MEMORY_FALLBACK_PATH || path.resolve('/home/agents/cecilia/logs/memory.txt');
const WEB_DAV_BASE_URL = process.env.WEBDAV_URL || 'http://192.168.4.55:8080/agents/cecilia/memory/';
const WEB_DAV_USER = process.env.WEBDAV_USER || 'mobile';
const WEB_DAV_PASS = process.env.WEBDAV_PASS || process.env.WEBDAV_PASSWD || null;
const WEB_DAV_TIMEOUT_MS = Number(process.env.WEBDAV_TIMEOUT_MS || 7000);
const PORT = Number(process.env.PORT || 3000);

function createServices(logger = console) {
  let store = null;

  try {
    store = new MemoryStore(DEFAULT_DB_PATH);
  } catch (error) {
    logger.warn('[memory] failed to initialise SQLite store, falling back to flat-file persistence', error);
  }

  let webdavClient = null;
  if (WEB_DAV_PASS) {
    webdavClient = new WebDavClient({
      baseUrl: WEB_DAV_BASE_URL,
      username: WEB_DAV_USER,
      password: WEB_DAV_PASS,
      timeoutMs: WEB_DAV_TIMEOUT_MS,
      logger,
    });
  }

  const persister = new MemoryPersister({
    store,
    webdavClient,
    flatFilePath: DEFAULT_FALLBACK_PATH,
    logger,
  });

  return { store, persister, webdavClient };
}

async function start(logger = console) {
  const services = createServices(logger);
  const app = createMemoryApp({
    store: services.store,
    persister: services.persister,
    webdavClient: services.webdavClient,
    logger,
  });

  const server = http.createServer(app);

  server.listen(PORT, () => {
    logger.log(
      `Memory API listening on port ${PORT} (db: ${services.store ? services.store.dbPath : 'flat-file'}, webdav: ${
        services.webdavClient ? services.webdavClient.baseUrl : 'disabled'
      })`
    );
  });

  const shutdown = (signal) => {
    logger.log(`[memory] received ${signal}. Shutting down Memory API.`);
    server.close(() => {
      if (services.store) {
        services.store.close();
      }
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return server;
}

if (require.main === module) {
  start(console).catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start Memory API server', error);
    process.exit(1);
  });
}

module.exports = {
  start,
  createServices,
};
