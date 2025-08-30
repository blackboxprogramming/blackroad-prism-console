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

test('compute adds numbers', async () => {
  const { server, base } = await setup();
  const res = await fetch(base + '/compute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expr: '1+1', mode: 'numeric' }) });
  const json = await res.json();
  assert.equal(json.numeric.value, 2);
  server.close();
});

test('precision clamp to 32 bits minimum', async () => {
  const { server, base } = await setup();
  const res = await fetch(base + '/compute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expr: '1', mode: 'numeric', precision: 1 }) });
  const json = await res.json();
  assert.equal(json.numeric.precision, 32);
  server.close();
});
