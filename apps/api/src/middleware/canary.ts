import { Request, Response, NextFunction } from 'express';
export function canaryMiddleware(percentage = 10) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const n = Math.random() * 100 < percentage;
    res.setHeader('X-Canary', n ? '1' : '0');
    next();
  };
}
