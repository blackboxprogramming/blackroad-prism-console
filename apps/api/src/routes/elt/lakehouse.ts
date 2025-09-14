import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='elt/lakehouse.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ tables:{} };
const write=(o:any)=>{ fs.mkdirSync('elt',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };

r.post('/lakehouse/tables/upsert',(req,res)=>{ const o=read(); const k=`${req.body?.db}.${req.body?.table}`; o.tables[k]=req.body||{}; write(o); res.json({ ok:true }); });
r.get('/lakehouse/tables/:db/:table',(req,res)=>{ const o=read(); const k=`${String(req.params.db)}.${String(req.params.table)}`; res.json(o.tables[k]||null); });

export default r;
