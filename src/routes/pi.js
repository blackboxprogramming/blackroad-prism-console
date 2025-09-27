'use strict';

let express;
try {
  express = require('express');
} catch (_err) {
  express = null;
}
const net = require('net');

const router = express ? express.Router() : { get: () => {} };

function parseNumber(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function checkTcp(host, port, timeout) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let finished = false;

    const finalize = (result) => {
      if (finished) return;
      finished = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeout);
    socket.once('connect', () => finalize(true));
    socket.once('timeout', () => finalize(false));
    socket.once('error', () => finalize(false));

    try {
      socket.connect(port, host);
    } catch (_err) {
      finalize(false);
    }
  });
}

async function buildStatusPayload() {
  const host = process.env.PI_HOST || '192.168.4.23';
  const port = parseNumber(process.env.PI_PORT, 22);
  const user = process.env.PI_USER || 'pi';
  const timeout = parseNumber(process.env.PI_TIMEOUT_MS, 2000);
  const targetUrl =
    process.env.PI_TARGET_URL || `http://${user}@${host}:${port}/`;

  const reachable = await checkTcp(host, port, timeout);

  return {
    ok: true,
    host,
    port,
    user,
    reachable,
    url: targetUrl,
    command: `ssh ${user}@${host} -p ${port}`,
    timeout_ms: timeout,
    ts: new Date().toISOString(),
  };
}

router.get('/status', async (_req, res) => {
  const payload = await buildStatusPayload();
  res.json(payload);
});

module.exports = router;
module.exports.buildStatusPayload = buildStatusPayload;

