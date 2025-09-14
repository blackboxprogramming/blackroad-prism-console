import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router(); const CH='portal/channels.json', S='data/portal/sends.jsonl';
const cread=()=> fs.existsSync(CH)? JSON.parse(fs.readFileSync(CH,'utf-8')):{ channels:{} };
const cwrite=(o:any)=>{ fs.mkdirSync('portal',{recursive:true}); fs.writeFileSync(CH, JSON.stringify(o,null,2)); };
const append=(row:any)=>{ fs.mkdirSync('data/portal',{recursive:true}); fs.appendFileSync(S, JSON.stringify(row)+'\n'); };
const recent=()=> fs.existsSync(S)? fs.readFileSync(S,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
r.post('/channels/register',(req,res)=>{ const o=cread(); const v=req.body||{}; o.channels[v.key]=v; cwrite(o); res.json({ ok:true }); });

r.post('/notify/send',(req,res)=>{
  const messageId=`m_${uuid().slice(0,8)}`; append({ ts:Date.now(), messageId, ...req.body, status:'queued' });
  res.json({ ok:true, messageId });
});

r.get('/sends/recent',(req,res)=>{ const ch=String(req.query.channel||''); const items=recent().reverse().filter((x:any)=>!ch||x.channel===ch).slice(0,200); res.json({ items }); });

export default r;
