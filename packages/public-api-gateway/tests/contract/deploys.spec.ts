import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { AddressInfo } from 'node:net';
import fetch, { RequestInit, Response } from 'node-fetch';
import { createGateway } from '../../src/index.js';

async function request(baseUrl: string, path: string, init: RequestInit): Promise<Response> {
  return fetch(new URL(path, baseUrl), init);
}

async function main() {
  const app = createGateway();
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const res = await request(baseUrl, '/v1/deploys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJhcHAiLCJzY29wZSI6ImRlcGxveTp3cml0ZSJ9.',
      },
      body: JSON.stringify({ serviceId: 'svc', environment: 'staging', gitRef: 'abc1234' }),
    });

    assert.equal(res.status, 201);
    assert.equal(res.headers.get('content-type'), 'application/json; charset=utf-8');
    const payload = await res.json();
    assert.ok(payload.releaseId, 'release id present');

    const idemKey = 'test-key';
    const idemRes1 = await request(baseUrl, '/v1/deploys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJhcHAiLCJzY29wZSI6ImRlcGxveTp3cml0ZSJ9.',
        'Idempotency-Key': idemKey,
      },
      body: JSON.stringify({ serviceId: 'svc', environment: 'staging', gitRef: 'abc1234' }),
    });
    assert.equal(idemRes1.status, 201);

    const idemRes2 = await request(baseUrl, '/v1/deploys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJhcHAiLCJzY29wZSI6ImRlcGxveTp3cml0ZSJ9.',
        'Idempotency-Key': idemKey,
      },
      body: JSON.stringify({ serviceId: 'svc', environment: 'staging', gitRef: 'abc1234' }),
    });
    assert.equal(idemRes2.status, 201);
    assert.equal(idemRes2.headers.get('idempotency-key'), idemKey);

    const rateLimitRes = await request(baseUrl, '/v1/deploys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(rateLimitRes.status, 403);
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
