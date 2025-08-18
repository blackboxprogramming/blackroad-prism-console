/* eslint-env node */
/* global process */
// Minimal Node healthcheck: exits 0 if server answers < 500 on /health (or /)
import http from 'http';

const host = '127.0.0.1';
const port = Number(process.env.PORT || 8000);
const path = process.env.HEALTH_PATH || '/health';

function check() {
  const req = http.request({ host, port, path, timeout: 3000 }, (res) => {
    if (res.statusCode && res.statusCode < 500) process.exit(0);
    else process.exit(1);
  });
  req.on('error', () => process.exit(1));
  req.end();
}
check();
