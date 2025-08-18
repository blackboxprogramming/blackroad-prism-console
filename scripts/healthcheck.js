// Robust health probe: tries /health then /, with timeout and JSON "status":"ok" support.

(async () => {
  const port = Number(process.env.PORT || 8000);
  const base = `http://127.0.0.1:${port}`;
  const paths = ['/health', '/'];
  const timeoutMs = 5000;

  for (const path of paths) {
    try {
      const controller = new AbortController();
      const to = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(base + path, { method: 'GET', signal: controller.signal });
      clearTimeout(to);

      if (res.ok) {
        // If JSON and status looks good, pass; otherwise any 2xx also passes
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        if (ct.includes('application/json')) {
          try {
            const body = await res.json();
            if (
              String(body.status || '')
                .toLowerCase()
                .includes('ok')
            )
              process.exit(0);
          } catch {
            // Non-JSON or parse error; fall through to OK by status
          }
        }
        process.exit(0);
      }
    } catch {
      // try next path
    }
  }
  process.exit(1);
})().catch(() => process.exit(1));
