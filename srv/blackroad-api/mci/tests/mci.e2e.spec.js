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

test('compute caching and health', async () => {
  const { server, base } = await setup();
  const body = { expr: '1+2', mode: 'numeric' };
  let res = await fetch(base + '/compute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  let json = await res.json();
  assert.equal(json.cache_hit, false);
  res = await fetch(base + '/compute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  json = await res.json();
  assert.equal(json.cache_hit, true);
  const healthRes = await fetch(base + '/health');
  const health = await healthRes.json();
  assert.ok(health.versions);
  server.close();
});
