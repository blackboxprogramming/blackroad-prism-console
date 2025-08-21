// Optional Sentry bridge: set SENTRY_DSN env/var to enable silently
export function initSentry() {
  const DSN = (import.meta.env.VITE_SENTRY_DSN || (window as any).SENTRY_DSN) as string | undefined;
  if (!DSN) return;
  import(/* @vite-ignore */ 'https://esm.sh/@sentry/browser')
    .then((S) => {
      S.init({ dsn: DSN, integrations: [], tracesSampleRate: 0.1 });
    })
    .catch(() => {});
}
