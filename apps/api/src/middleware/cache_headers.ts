import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
export function cacheHeaders(surrogateKey='api'){
  return (req: Request, res: Response, next: NextFunction) => {
    const tag = surrogateKey;
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=600');
    res.setHeader('Surrogate-Key', tag);
    const hash = crypto.createHash('sha1').update(req.originalUrl).digest('hex');
    res.setHeader('ETag', hash);
    next();
  };
}
