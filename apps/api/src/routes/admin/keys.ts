import { Router } from 'express';
import { issue, list, revoke } from '../../lib/keys/store.js';
const r = Router();
r.post('/issue', (req, res) => { const owner = String(req.body?.owner||'unknown'); const k = issue(owner); res.json({ ok:true, key:k }); });
r.post('/revoke', (req, res) => { const id = String(req.body?.id||req.body?.key||''); const k = revoke(id); if (!k) return res.status(404).json({error:'not_found'}); res.json({ ok:true, key:k }); });
r.get('/list', (_req, res) => res.json({ ok:true, keys:list() }));
export default r;
