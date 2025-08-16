export function telemetryInit() {
  if (import.meta.env?.VITE_TELEMETRY !== 'on') return;
  try {
    const t = {
      ts: Date.now(),
      event: 'pageview',
      path: globalThis.location.pathname,
    };
    globalThis.console.log('[telemetry]', t);
  } catch {
    // ignore
  }
}
