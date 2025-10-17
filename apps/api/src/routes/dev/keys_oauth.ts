
import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router();
const KEYS='data/dev/keys.jsonl', OAUTH='dev/oauth_clients.json';
const append=(row:any)=>{ fs.mkdirSync('data/dev',{recursive:true}); fs.appendFileSync(KEYS, JSON.stringify(row)+'\n'); };
const lines=()=> fs.existsSync(KEYS)? fs.readFileSync(KEYS,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
const cRead=()=> fs.existsSync(OAUTH)? JSON.parse(fs.readFileSync(OAUTH,'utf-8')):{ clients:{} };
const cWrite=(o:any)=>{ fs.mkdirSync('dev',{recursive:true}); fs.writeFileSync(OAUTH, JSON.stringify(o,null,2)); };

r.post('/keys/mint',(req,res)=>{
  const token=`ak_${uuid().slice(0,8)}`; const row={ ts:Date.now(), token, subject:req.body?.subject, scopes:req.body?.scopes||[], ttl_s:Number(req.body?.ttl_s||3600), revoked:false };
  append(row); res.json({ ok:true, token });
});
r.post('/keys/revoke',(req,res)=>{
  const tok=String(req.body?.token||''); const rows=lines().map((x:any)=> x.token===tok?{...x,revoked:true,revokedAt:Date.now()}:x);
  fs.writeFileSync(KEYS, rows.map(x=>JSON.stringify(x)).join('\n')+'\n'); res.json({ ok:true });
});
r.get('/keys/recent',(_req,res)=>{ res.json({ items: lines().reverse().slice(0,200) }); });

r.post('/oauth/client/upsert',(req,res)=>{ const o=cRead(); const v=req.body||{}; o.clients[v.client_id]=v; cWrite(o); res.json({ ok:true }); });
r.get('/oauth/clients',(_req,res)=>{ res.json(cRead().clients||{}); });

export default r;
