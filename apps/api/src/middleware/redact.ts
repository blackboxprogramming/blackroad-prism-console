import { Request, Response, NextFunction } from 'express';
export function redact(req: Request, _res: Response, next: NextFunction) {
  if (req.body) {
    for (const k of Object.keys(req.body)) {
      if (/password|secret|token|key/i.test(k)) req.body[k] = '[REDACTED]';
    }
  }
  next();
}
