module.exports = function attachYjsCb({ app }) {
  app.post('/api/collab/yjs-callback', (req, res) => {
    let raw = '';
    req.on('data', (d) => (raw += d));
    req.on('end', () => {
      try {
        console.log('[yjs] callback', raw.slice(0, 200));
      } catch {}
      res.json({ ok: true });
    });
  });
  console.log('[yjs] callback endpoint attached');
};
