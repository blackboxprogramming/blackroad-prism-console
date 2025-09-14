import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router(); const T='data/support/tickets.jsonl', M='data/support/messages.jsonl';
const append=(p:string,row:any)=>{ fs.mkdirSync('data/support',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const list=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
r.post('/tickets/create',(req,res)=>{ const id=req.body?.ticketId || `T-${uuid().slice(0,8)}`; append(T,{ ts:Date.now(), ticketId:id, ...req.body }); res.json({ ok:true, ticketId:id }); });
r.post('/messages/add',(req,res)=>{ append(M,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.post('/tickets/state',(req,res)=>{ append(T,{ ts:Date.now(), ticketId:req.body?.ticketId, stateChange:true, status:req.body?.status, assignee:req.body?.assignee||null }); res.json({ ok:true }); });
r.get('/tickets/:ticketId',(req,res)=>{ const id=String(req.params.ticketId); const ti=list(T).filter((x:any)=>x.ticketId===id); const ms=list(M).filter((x:any)=>x.ticketId===id); res.json({ header: ti[0]||null, events: ti, messages: ms }); });
export default r;
