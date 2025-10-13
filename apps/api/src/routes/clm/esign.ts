import { Router } from 'express';
import crypto from 'node:crypto';
import fs from 'fs';

const r = Router();
const FILE='data/clm/contracts.jsonl';
const read=()=> fs.existsSync(FILE)? fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
const write=(rows:any[])=> fs.writeFileSync(FILE, rows.map(x=>JSON.stringify(x)).join('\n')+'\n');

function verify(req:any){
  const secret = process.env.ESIGN_WEBHOOK_SECRET || '';
  const sig = String(req.headers['x-esign-signature']||'');
  const mac = crypto.createHmac('sha256', secret).update(req.rawBody||'').digest('hex');
  return sig === mac;
}

r.post('/esign/webhook', (req:any,res)=>{
  if (!verify(req)) return res.status(401).send('bad_sig');
  const evt = req.body||{};
  if (evt.type === 'document.signed') {
    const rows = read();
    const c = rows.find((x:any)=>x.id===evt.contractId);
    if (c) { c.state='Signed'; c.signedAt=Date.now(); write(rows); }
  }
  res.json({ ok:true });
});

export default r;
