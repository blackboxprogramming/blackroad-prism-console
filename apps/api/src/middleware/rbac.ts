import { Request, Response, NextFunction } from 'express';
const ORDER = ['viewer','member','admin','owner'];
export function requireRole(min: 'viewer'|'member'|'admin'|'owner' = 'member'){
  return (req: any, res: Response, next: NextFunction) => {
    const role = String(req.membership?.role||'');
    if (!role) return res.status(403).json({ error:'forbidden' });
    if (ORDER.indexOf(role) < ORDER.indexOf(min)) return res.status(403).json({ error:'insufficient_role', need:min });
    next();
  };
}
