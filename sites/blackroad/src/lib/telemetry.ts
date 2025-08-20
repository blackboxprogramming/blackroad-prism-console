export function telemetryInit() {}
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
  } catch {}
}
export function telemetryInit() {}
export function telemetryInit() {
  if (import.meta.env?.VITE_TELEMETRY !== 'on') return;
  try {
    const t = { ts: Date.now(), event: 'pageview', path: location.pathname };
    console.log('[telemetry]', t);
  } catch {
    // ignore
  }
}
export function telemetryInit() {}
export function telemetryInit() {
  if (import.meta.env?.VITE_TELEMETRY !== 'on') return;
  try {
    const t = { ts: Date.now(), event: 'pageview', path: location.pathname };
    console.log('[telemetry]', t);
  } catch {
    // ignore
  }
export function telemetryInit() {
  // Placeholder for analytics/telemetry setup
  if (typeof window === 'undefined') return
  // no-op
  } catch (_err) {
    // swallow telemetry errors
  }
}
