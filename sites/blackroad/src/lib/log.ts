export async function logClientError(err: unknown) {
  try {
    const body = { ts: new Date().toISOString(), href: location.href, err: String(err) };
    // Real endpoint would be your API; static fallback:
    if (location.host.includes('github.io') || location.protocol === 'file:') {
      console.warn('[client-error]', body);
      return;
    }
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {});
  } catch {}
}
