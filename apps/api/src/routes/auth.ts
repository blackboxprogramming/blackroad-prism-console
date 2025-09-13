import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { setSessionCookie, clearSessionCookie } from '../middleware/session.js';

const r = Router();
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

r.post('/login', async (req, res) => {
  const { email, name } = req.body || {};
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'email required' });
  const user = await prisma.user.upsert({ where: { email }, update: { name }, create: { email, name } });
  const secret = process.env.SESSION_SECRET || '';
  setSessionCookie(res, { uid: user.id, email: user.email, exp: Date.now() + MAX_AGE * 1000 }, secret, MAX_AGE);
  res.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
});

r.post('/logout', (_req, res) => { clearSessionCookie(res); res.json({ ok: true }); });

r.get('/me', async (req, res) => {
  const s = (req as any).session;
  if (!s?.uid) return res.status(401).json({ error: 'unauthenticated' });
  const u = await prisma.user.findUnique({ where: { id: s.uid } });
  if (!u) return res.status(401).json({ error: 'invalid session' });
  res.json({ id: u.id, email: u.email, name: u.name });
});

export default r;
