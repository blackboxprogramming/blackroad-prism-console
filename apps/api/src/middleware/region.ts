import { Request, Response, NextFunction } from 'express';
export function regionMiddleware(defaultRegion = process.env.DEFAULT_REGION || 'us'){
  return (req: Request, res: Response, next: NextFunction) => {
    const q = (req.query.region as string)||'';
    const h = String(req.headers['x-region']||'');
    const r = q || h || defaultRegion;
    res.setHeader('X-Region', r);
    (req as any).region = r;
    next();
  };
}
