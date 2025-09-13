import assert from 'node:assert';
import http from 'node:http';
import { test } from 'node:test';

test('health returns 200', async () => {
  const res = await new Promise<http.IncomingMessage>(r => {
    http.get('http://127.0.0.1:4000/api/health', r);
  });
  assert.equal(res.statusCode, 200);
});
