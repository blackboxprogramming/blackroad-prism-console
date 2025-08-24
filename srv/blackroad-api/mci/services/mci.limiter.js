const hits = new Map();
module.exports = (req, res, next) => {
  const now = Date.now();
  const ip = req.ip || 'global';
  const entry = hits.get(ip) || { count: 0, ts: now };
  if (now - entry.ts > 60 * 1000) {
    entry.count = 0;
    entry.ts = now;
  }
  entry.count++;
  hits.set(ip, entry);
  if (entry.count > 60) {
    return res.status(429).json({ error: 'RATE_LIMIT' });
  }
  next();
};
