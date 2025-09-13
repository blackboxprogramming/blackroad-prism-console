import { Request, Response, NextFunction } from 'express';

const buckets = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 60_000;
const LIMIT = 60;

export function rateLimit(){
  return (req: any, res: Response, next: NextFunction) => {
    const ak = req.apiKey;
    const key = `${(req as any).org?.id || 'anon'}:${ak?.key || req.ip}`;
    const now = Date.now();
    const b = buckets.get(key);
    if (b && now < b.reset) {
      if (b.count >= LIMIT) return res.status(429).json({ error:'rate_limit' });
      b.count++;
    } else {
      buckets.set(key, { count: 1, reset: now + WINDOW_MS });
    }
    next();
  };
}
