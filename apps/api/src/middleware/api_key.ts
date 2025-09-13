import { Request, Response, NextFunction } from 'express';
import { getActive } from '../lib/keys/store.js';

export function apiKeyAuth() {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.header('x-br-key') || '';
    const k = key ? getActive(key) : undefined;
    if (!k) return res.status(401).json({ error:'invalid_api_key' });
    (req as any).apiKey = k;
    next();
  };
}
