app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

const attachOps = require('./ops_middleware');
attachOps(app);
