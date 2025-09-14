
import { Router } from 'express';
import fs from 'fs';
const r = Router(); const REG='dev/webhooks.json', DEL='data/dev/webhook_deliveries.jsonl';
const read=()=> fs.existsSync(REG)? JSON.parse(fs.readFileSync(REG,'utf-8')):{ hooks:{} };
const write=(o:any)=>{ fs.mkdirSync('dev',{recursive:true}); fs.writeFileSync(REG, JSON.stringify(o,null,2)); };
const append=(row:any)=>{ fs.mkdirSync('data/dev',{recursive:true}); fs.appendFileSync(DEL, JSON.stringify(row)+'\n'); };
const items=()=> fs.existsSync(DEL)? fs.readFileSync(DEL,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
r.post('/webhooks/register',(req,res)=>{ const o=read(); const v=req.body||{}; o.hooks[v.id]=v; write(o); res.json({ ok:true }); });
r.post('/webhooks/deliver',(req,res)=>{ const { event, payload }=req.body||{}; append({ ts:Date.now(), event, payload, status:'queued', attempts:0 }); res.json({ ok:true }); });
r.get('/webhooks/recent',(req,res)=>{ const ev=String(req.query.event||''); const list=items().reverse().filter((x:any)=>!ev||x.event===ev).slice(0,200); res.json({ items:list }); });
export default r;
