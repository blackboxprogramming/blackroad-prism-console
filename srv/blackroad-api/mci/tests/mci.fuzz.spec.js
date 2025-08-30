const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const router = require('../routes/mci.routes');

function setup() {
  const app = express();
  app.use('/api/mci', router);
  return new Promise(resolve => {
    const server = app.listen(0, () => {
      const port = server.address().port;
      resolve({ server, base: `http://127.0.0.1:${port}/api/mci` });
    });
  });
}

test('rejects __import__ attempts', async () => {
  const { server, base } = await setup();
  const res = await fetch(base + '/compute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expr: "__import__('os')", mode: 'numeric' }) });
  assert.equal(res.status, 400);
  server.close();
});
