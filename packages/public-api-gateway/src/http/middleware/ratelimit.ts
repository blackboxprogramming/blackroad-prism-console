import rateLimit from 'express-rate-limit';

export function rateLimitMiddleware() {
  return rateLimit({
    windowMs: 60 * 1000,
    max: (req) => {
      if (req.auth?.actor?.type === 'service') {
        return 240;
      }
      return 120;
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({ error: { code: 'rate_limited', message: 'Too many requests' } });
    },
  });
}
