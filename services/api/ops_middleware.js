// lightweight /api/ops endpoint for status
module.exports = function attachOps(app) {
  const started = new Date().toISOString();
  let windowErrors = 0, totalErrors = 0, windowStart = Date.now();

  app.use((err, req, res, next) => {
    totalErrors++; windowErrors++;
    next(err);
  });

  setInterval(() => { windowErrors = 0; windowStart = Date.now(); }, 5 * 60 * 1000);

  app.get('/api/ops', (_req, res) => {
    const now = Date.now();
    const mins = (now - windowStart) / 60000;
    res.json({
      ok: true,
      service: 'blackroad-api',
      version: process.env.VERSION || 'dev',
      started,
      error_rate_5m: mins > 0 ? (windowErrors / (mins || 1)) : 0
    });
  });
}
