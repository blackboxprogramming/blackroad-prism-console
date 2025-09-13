import { Request, Response, NextFunction } from 'express';
export function orgResolver(){
  return (req: any, res: Response, next: NextFunction) => {
    const hdr = String(req.headers['x-br-org']||'').trim();
    const sess = (req.session?.orgId) || '';
    const orgId = hdr || sess || '';
    if (orgId) (req as any).org = { id: orgId };
    res.setHeader('X-Org', orgId || 'none');
    next();
  };
}
export function requireOrg(){
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.org?.id) return res.status(400).json({ error:'org_required' });
    next();
  };
}
