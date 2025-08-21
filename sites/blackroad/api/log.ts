/**
 * Faux error log endpoint for static hosting.
 * We can't persist on Pages; this simply `postMessage`s so you can see logs in devtools.
 */
addEventListener('fetch', (event) => {
  event.respondWith(
    new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } })
  );
});
