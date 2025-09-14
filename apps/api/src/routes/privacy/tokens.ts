import { Router } from 'express';
import fs from 'fs';
import crypto from 'crypto';
const r = Router(); const TOK='privacy/tokens.json';
const read=()=> fs.existsSync(TOK)? JSON.parse(fs.readFileSync(TOK,'utf-8')):{ namespaces:{} };
const write=(o:any)=>{ fs.mkdirSync('privacy',{recursive:true}); fs.writeFileSync(TOK, JSON.stringify(o,null,2)); };

function hmac(val:string){ const key=process.env.PRIVACY_TOKEN_KMS_KEY||'key'; return crypto.createHmac('sha256',key).update(val).digest('hex').slice(0,24); }

r.post('/tokenize',(req,res)=>{ const o=read(); const ns=req.body?.namespace||'default'; const v=String(req.body?.value||''); const token=hmac(ns+':'+v); o.namespaces[ns]=o.namespaces[ns]||{}; o.namespaces[ns][token]=v; write(o); res.json({ ok:true, token }); });
r.post('/detokenize',(req,res)=>{ const o=read(); const ns=req.body?.namespace||'default'; const token=String(req.body?.token||''); const val=o.namespaces?.[ns]?.[token]||null; res.json({ ok:true, value: val }); });

export default r;
