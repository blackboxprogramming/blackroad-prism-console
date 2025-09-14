import { Router } from 'express';
import fs from 'fs';
const r = Router(); const P='privacy/policies.json', C='privacy/classifications.json';
const read=(p:string,d:any)=> fs.existsSync(p)? JSON.parse(fs.readFileSync(p,'utf-8')):d;
const write=(p:string,o:any)=>{ fs.mkdirSync(p.split('/').slice(0,-1).join('/'),{recursive:true}); fs.writeFileSync(p, JSON.stringify(o,null,2)); };

r.post('/policies/set',(req,res)=>{ write(P,{ policies: req.body?.policies||[] }); res.json({ ok:true }); });
r.post('/classifications/set',(req,res)=>{ write(C,{ classes: req.body?.classes||[] }); res.json({ ok:true }); });
r.get('/policies',(_req,res)=> res.json(read(P,{policies:[]})));
r.get('/classifications',(_req,res)=> res.json(read(C,{classes:[]})));
export default r;
