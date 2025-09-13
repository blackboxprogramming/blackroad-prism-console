import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const r = Router();
function seq(): string {
  const stamp = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const n = String(Math.floor(Math.random()*9000 + 1000));
  return `INV-${stamp}-${n}`;
}

r.post('/create', async (req, res) => {
  const id = seq();
  const payload = {
    id,
    ts: Date.now(),
    from: process.env.BILLING_FROM_ENTITY || 'BlackRoad Inc.',
    to: req.body?.to || { name: '<REPLACE_ME>', email: '<REPLACE_ME>' },
    items: req.body?.items || [{ sku: 'BLACKROAD-PRO', qty: 1, unit: 1200 }],
    currency: req.body?.currency || 'USD',
    terms: 'Net 30',
    due_at: req.body?.due_at || new Date(Date.now()+30*86400000).toISOString()
  };
  const outDir = path.join(process.cwd(), 'invoices');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${id}.json`), JSON.stringify(payload, null, 2));
  res.json({ ok: true, id, path: `invoices/${id}.json` });
});

export default r;
