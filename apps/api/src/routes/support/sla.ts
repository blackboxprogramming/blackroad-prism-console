import { Router } from 'express';
import fs from 'fs';
const r = Router(); const POL='support/sla.json', LOG='data/support/sla_events.jsonl', T='data/support/tickets.jsonl';
const read=()=> fs.existsSync(POL)? JSON.parse(fs.readFileSync(POL,'utf-8')):{ policies:[] };
const write=(o:any)=>{ fs.mkdirSync('support',{recursive:true}); fs.writeFileSync(POL, JSON.stringify(o,null,2)); };
const append=(row:any)=>{ fs.mkdirSync('data/support',{recursive:true}); fs.appendFileSync(LOG, JSON.stringify(row)+'\n'); };
const tickets=()=> fs.existsSync(T)? fs.readFileSync(T,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
r.post('/sla/policies/set',(req,res)=>{ write({ policies: req.body?.policies||[] }); res.json({ ok:true }); });
r.post('/sla/evaluate',(req,res)=>{
  const id=String(req.body?.ticketId||''); const t = tickets().find((x:any)=>x.ticketId===id) || {};
  const pol=(read().policies||[]).find((p:any)=>p.priority===t.priority)||{first_response_min:60,resolve_min:1440};
  const ev={ ts:Date.now(), ticketId:id, policy:pol, status:'ok' };
  append(ev); res.json({ ok:true, event: ev });
});
r.get('/sla/recent',(_req,res)=>{ const items=fs.existsSync(LOG)? fs.readFileSync(LOG,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).reverse().slice(0,200):[]; res.json({ items }); });
export default r;
