import { Router } from 'express';
import fs from 'fs';
const r = Router(); const RULE='privacy/dlp_rules.json', FIND='data/privacy/dlp_findings.jsonl';
const read=()=> fs.existsSync(RULE)? JSON.parse(fs.readFileSync(RULE,'utf-8')):{ rules:[] };
const write=(o:any)=>{ fs.mkdirSync('privacy',{recursive:true}); fs.writeFileSync(RULE, JSON.stringify(o,null,2)); };
const append=(row:any)=>{ fs.mkdirSync('data/privacy',{recursive:true}); fs.appendFileSync(FIND, JSON.stringify(row)+'\n'); };
const lines=()=> fs.existsSync(FIND)? fs.readFileSync(FIND,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
r.post('/dlp/rules/set',(req,res)=>{ write({ rules: req.body?.rules||[] }); res.json({ ok:true }); });
r.post('/dlp/findings/ingest',(req,res)=>{ append({ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/dlp/findings/recent',(req,res)=>{ const cls=String(req.query.class||''); const items=lines().reverse().filter((x:any)=>!cls||x.class===cls).slice(0,200); res.json({ items }); });
export default r;
