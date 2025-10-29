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
