import { Request, Response, NextFunction } from 'express';
export function localeMiddleware(defaultLocale='en'){
  return (req: Request, res: Response, next: NextFunction) => {
    const q=String(req.query.lang||'');
    const h=String(req.headers['accept-language']||'').split(',')[0];
    const l=(q||h||defaultLocale).slice(0,2);
    res.setHeader('X-Locale', l);
    (req as any).locale = l;
    next();
  };
}
