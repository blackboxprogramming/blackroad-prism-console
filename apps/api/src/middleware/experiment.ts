import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
const COOKIE = process.env.EXPERIMENT_COOKIE || 'br_exp';

export function assignExperiment(variants: string[] = ['A','B']) {
  return (req: Request, res: Response, next: NextFunction) => {
    let v = (req.cookies && req.cookies[COOKIE]) || '';
    if (!v) {
      const h = crypto.createHash('sha1').update((req.ip||'') + (req.headers['user-agent']||'')).digest('hex');
      v = variants[parseInt(h.slice(0,2),16) % variants.length];
      res.cookie(COOKIE, v, { httpOnly: false, sameSite: 'Lax', maxAge: 60*60*24*90*1000 });
    }
    (req as any).variant = v;
    res.setHeader('X-Experiment-Variant', v);
    next();
  };
}
