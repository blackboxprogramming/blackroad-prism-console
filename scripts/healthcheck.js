/* FILE: scripts/healthcheck.js */
const DEFAULT_PORT = process.env.PORT || 8000;
const endpoint = process.env.HEALTH_ENDPOINT || `http://localhost:${DEFAULT_PORT}/healthz`;

const abort = new AbortController();
const timeout = setTimeout(() => abort.abort(), 4000);

(async () => {
  try {
    const res = await fetch(endpoint, { signal: abort.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      console.error(`Healthcheck: HTTP ${res.status}`);
      process.exit(2);
    }
    const body = await res.text().catch(() => '');
    if (!body || !/ok/i.test(body)) {
      console.error(`Healthcheck: unexpected body: ${body}`);
      process.exit(3);
    }
    console.log('ok');
    process.exit(0);
  } catch (err) {
    console.error(`Healthcheck error: ${err && err.message ? err.message : err}`);
    process.exit(1);
  }
})();
