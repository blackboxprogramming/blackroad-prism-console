import assert from 'node:assert/strict';
import http from 'node:http';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkServer } from '../helpers/test_server.ts';

type JsonResponse = { statusCode: number; body: any };

function requestJson(port: number, method: string, path: string, payload?: unknown): Promise<JsonResponse> {
  return new Promise((resolve, reject) => {
    const data = payload !== undefined ? JSON.stringify(payload) : undefined;
    const headers: Record<string, string> = {};
    if (data) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(data).toString();
    }
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          const body = raw ? JSON.parse(raw) : undefined;
          resolve({ statusCode: res.statusCode ?? 0, body });
        });
      },
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

test('broadcast updates devices and returns ping summary', async () => {
  const tmpRoot = mkdtempSync(join(tmpdir(), 'api-devices-'));
  const agentsRoot = join(tmpRoot, 'agents');
  process.env.API_DATA_ROOT = tmpRoot;
  process.env.API_AGENTS_ROOT = agentsRoot;

  mkdirSync(join(tmpRoot, 'data', 'admin'), { recursive: true });
  const now = Date.now();
  writeFileSync(
    join(tmpRoot, 'data', 'admin', 'devices.json'),
    JSON.stringify(
      [
        { deviceId: 'pi-01', owner: 'ops', platform: 'linux', encrypted: true, compliant: true, lastSeen: now },
        { deviceId: 'jetson-01', owner: 'ml', platform: 'linux', encrypted: false, compliant: false, lastSeen: now },
      ],
      null,
      2,
    ),
  );

  mkdirSync(join(tmpRoot, 'iam'), { recursive: true });
  writeFileSync(
    join(tmpRoot, 'iam', 'devices.json'),
    JSON.stringify(
      {
        devices: {
          'pi-01': { posture: { compliant: true } },
          'jetson-01': { posture: { compliant: false } },
        },
      },
      null,
      2,
    ),
  );

  mkdirSync(join(tmpRoot, 'elt'), { recursive: true });
  writeFileSync(join(tmpRoot, 'elt', 'sources.json'), JSON.stringify({ sources: { src1: { status: 'ok' } } }, null, 2));
  writeFileSync(
    join(tmpRoot, 'elt', 'sinks.json'),
    JSON.stringify({ sinks: { sink1: { status: 'ok' }, sink2: { status: 'ok' } } }, null, 2),
  );

  mkdirSync(join(agentsRoot, 'alpha'), { recursive: true });
  writeFileSync(join(agentsRoot, 'alpha', 'manifest.json'), JSON.stringify({ name: 'alpha' }));
  mkdirSync(join(agentsRoot, 'beta'), { recursive: true });
  writeFileSync(join(agentsRoot, 'beta', 'manifest.json'), JSON.stringify({ name: 'beta' }));

  const server = mkServer();
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;

  try {
    const broadcast = await requestJson(port, 'POST', '/api/admin/devices/broadcast', { message: 'Status update' });
    assert.equal(broadcast.statusCode, 200);
    assert.equal(broadcast.body.ok, true);
    assert.equal(broadcast.body.delivered, 2);
    assert.equal(broadcast.body.summary.devices.total, 2);
    assert.equal(broadcast.body.summary.devices.online, 2);
    assert.equal(broadcast.body.summary.connectors.sources, 1);
    assert.equal(broadcast.body.summary.connectors.sinks, 2);
    assert.equal(broadcast.body.summary.agents.total, 2);
    assert.equal(broadcast.body.summary.iam.total, 2);
    assert.equal(broadcast.body.summary.iam.compliant, 1);
    assert.ok(broadcast.body.summary.lastBroadcast);

    const logPath = join(tmpRoot, 'data', 'admin', 'device_broadcasts.jsonl');
    assert.equal(existsSync(logPath), true);
    const logLines = readFileSync(logPath, 'utf-8').trim().split('\n').filter(Boolean);
    assert.equal(logLines.length, 1);

    const storedDevices = JSON.parse(readFileSync(join(tmpRoot, 'data', 'admin', 'devices.json'), 'utf-8'));
    assert.ok(storedDevices.every((d: any) => typeof d.lastPostAt === 'number'));
    assert.ok(storedDevices.every((d: any) => d.lastPostMessage === 'Status update'));

    const ping = await requestJson(port, 'GET', '/api/admin/devices/ping');
    assert.equal(ping.statusCode, 200);
    assert.equal(ping.body.ok, true);
    assert.equal(ping.body.summary.devices.total, 2);
    assert.equal(ping.body.summary.lastBroadcast.message, 'Status update');
    assert.equal(ping.body.summary.lastBroadcast.devices.length, 2);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    delete process.env.API_DATA_ROOT;
    delete process.env.API_AGENTS_ROOT;
    rmSync(tmpRoot, { recursive: true, force: true });
  }
});
