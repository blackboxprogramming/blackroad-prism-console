import { Request, Response, NextFunction } from 'express';
const buckets = new Map<string, { count:number; reset:number }>();

export function rateLimit() {
  return (req: Request, res: Response, next: NextFunction) => {
    const ak = (req as any).apiKey;
    const max = ak?.quota?.max ?? Number(process.env.RATE_LIMIT_MAX || 600);
    const windowSec = ak?.quota?.windowSec ?? Number(process.env.RATE_LIMIT_WINDOW_SEC || 60);
    const now = Date.now();
    const key = ak?.key || req.ip;
    const b = buckets.get(key) || { count: 0, reset: now + windowSec*1000 };
    if (now > b.reset) { b.count = 0; b.reset = now + windowSec*1000; }
    b.count += 1; buckets.set(key, b);
    const remaining = Math.max(0, max - b.count);
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.floor(b.reset/1000)));
    if (b.count > max) return res.status(429).json({ error:'rate_limited' });

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
