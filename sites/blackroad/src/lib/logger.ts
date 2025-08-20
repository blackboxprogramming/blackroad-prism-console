export function logToWorker(url: string, level: 'error'|'warn'|'info', msg: string, meta: Record<string, unknown> = {}) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    msg,
    route: location.pathname,
    ua: navigator.userAgent,
    ref: document.referrer,
    meta
  }
  try {
    navigator.sendBeacon?.(url, new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  } catch {
    fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }).catch(()=>{})
  }
}
