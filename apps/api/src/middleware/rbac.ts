import { Response, NextFunction } from 'express';
import { prisma } from '../lib/db.js';

const ORDER = ['viewer','member','admin','owner'];

async function loadMembership(req: any){
  if (!req.org?.id || !req.session?.uid) return null;
  if (!req.membership || req.membership.orgId !== req.org.id || req.membership.userId !== req.session.uid) {
    req.membership = await prisma.membership.findFirst({
      where:{ orgId: req.org.id, userId: req.session.uid },
    });
  }
  return req.membership || null;
}

export function requireRole(min: 'viewer'|'member'|'admin'|'owner' = 'member'){
  return async (req: any, res: Response, next: NextFunction) => {
    if (!req.org?.id) return res.status(400).json({ error:'org_required' });
    if (!req.session?.uid) return res.status(401).json({ error:'login_required' });
    const membership = await loadMembership(req);
    const role = String(membership?.role || '');
    if (!role) return res.status(403).json({ error:'forbidden' });
    if (ORDER.indexOf(role) < ORDER.indexOf(min)) return res.status(403).json({ error:'insufficient_role', need:min });
    next();
  };
}
