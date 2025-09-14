import { Router } from 'express';
import fs from 'fs';
const r = Router();
const V='data/fac/visitors.jsonl', B='fac/badges.json', BE='data/fac/badge_events.jsonl';
const append=(p:string,row:any)=>{ fs.mkdirSync('data/fac',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const bread=()=> fs.existsSync(B)? JSON.parse(fs.readFileSync(B,'utf-8')):{ badges:{} };
const bwrite=(o:any)=>{ fs.mkdirSync('fac',{recursive:true}); fs.writeFileSync(B, JSON.stringify(o,null,2)); };
const vlist=()=> fs.existsSync(V)? fs.readFileSync(V,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
r.post('/visitors/preregister',(req,res)=>{ append(V,{ ts:Date.now(), state:'preregistered', ...req.body }); res.json({ ok:true }); });
r.post('/visitors/signin',(req,res)=>{ append(V,{ ts:req.body?.ts||Date.now(), state:'signed_in', ...req.body }); res.json({ ok:true }); });
r.get('/visitors/recent',(req,res)=>{ const host=String(req.query.hostId||''), loc=String(req.query.locationId||''); const items=vlist().reverse().filter((x:any)=>(!host||x.hostId===host)&&(!loc||x.locationId===loc)).slice(0,200); res.json({ items }); });

r.post('/badges/issue',(req,res)=>{ const o=bread(); const v=req.body||{}; o.badges[v.badgeId]=Object.assign({active:true}, v); bwrite(o); append(BE,{ ts:Date.now(), event:'issue', ...v }); res.json({ ok:true }); });
r.post('/badges/revoke',(req,res)=>{ const o=bread(); const id=String(req.body?.badgeId||''); if(o.badges[id]) o.badges[id].active=false; bwrite(o); append(BE,{ ts:Date.now(), event:'revoke', badgeId:id, reason:req.body?.reason||'' }); res.json({ ok:true }); });

export default r;
