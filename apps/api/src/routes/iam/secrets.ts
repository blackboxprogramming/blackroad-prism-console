import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='iam/secrets.json', ROT='data/iam/secrets_rotations.jsonl';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ secrets:{} };
const write=(o:any)=>{ fs.mkdirSync('iam',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
const append=(row:any)=>{ fs.mkdirSync('data/iam',{recursive:true}); fs.appendFileSync(ROT, JSON.stringify(row)+'\n'); };

r.post('/secrets/put',(req,res)=>{ const o=read(); const { key, value, owner, rotate_days } = req.body||{}; o.secrets[key]={ value, owner, rotate_days:Number(rotate_days||90), updatedAt:Date.now() }; write(o); res.json({ ok:true }); });
r.post('/secrets/rotate',(req,res)=>{ const o=read(); const k=String(req.body?.key||''); if(!o.secrets[k]) return res.status(404).json({error:'not_found'}); o.secrets[k].value=`rot_${Math.random().toString(36).slice(2,10)}`; o.secrets[k].updatedAt=Date.now(); write(o); append({ ts:Date.now(), key:k }); res.json({ ok:true }); });
r.get('/secrets/get',(req,res)=>{ const o=read(); const k=String(req.query.key||''); res.json(o.secrets[k]||null); });

export default r;
