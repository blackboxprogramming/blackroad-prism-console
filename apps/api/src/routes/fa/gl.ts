import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='data/fa/gl_exports.jsonl', J='data/fa/depr_journal.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/fa',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); };
const read=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
r.post('/gl/export',(req,res)=>{
  const period=String(req.body?.period||new Date().toISOString().slice(0,7));
  const j=read(J).filter((x:any)=>x.period===period);
  const gl={ period, entries: j.flatMap((x:any)=>x.je) };
  append({ ts:Date.now(), ...gl }); res.json({ ok:true, gl });
});
r.get('/gl/recent',(_req,res)=>{ const rows=read(FILE).reverse().slice(0,12); res.json({ items: rows }); });
export default r;
