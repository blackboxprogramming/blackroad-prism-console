export function analyticsInit() {
  const enabled = (import.meta.env?.VITE_ANALYTICS || 'off') === 'on';
  if (!enabled) return;
  // privacy-friendly placeholder (Plausible-like hook)
  console.log('[analytics] pageview', location.pathname);
}

export function sentryInit() {
  const dsn = import.meta.env?.VITE_SENTRY_DSN;
  if (!dsn) return;
  // lightweight stub - integrate real SDK later
  // @ts-ignore
  window.__SENTRY_DSN__ = dsn;
  console.log('[sentry] initialized');
}
