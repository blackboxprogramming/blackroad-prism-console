
import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='dev/apis.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ apis:{} };
const write=(o:any)=>{ fs.mkdirSync('dev',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };
r.post('/apis/upsert',(req,res)=>{ const o=read(); const v=req.body||{}; o.apis[v.name]=v; write(o); res.json({ ok:true }); });
r.get('/apis/:name',(req,res)=>{ const o=read(); res.json(o.apis[String(req.params.name)]||null); });
export default r;
