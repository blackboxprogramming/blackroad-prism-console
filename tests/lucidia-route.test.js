const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const lucidia = require('../src/routes/lucidia');

test('GET /lucidia/health', async () => {
  const app = express();
  app.use('/lucidia', lucidia);
  const server = app.listen(0);
  const port = server.address().port;
  const res = await fetch(`http://127.0.0.1:${port}/lucidia/health`);
  const json = await res.json();
  assert.deepEqual(json, { ok: true, service: 'lucidia' });
  server.close();
});
