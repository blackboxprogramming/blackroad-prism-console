import { Router } from 'express';
import fs from 'fs';
const r = Router(); const U='iam/users.json', G='iam/groups.json';
const read=(p:string,d:any)=> fs.existsSync(p)? JSON.parse(fs.readFileSync(p,'utf-8')):d;
const write=(p:string,o:any)=>{ fs.mkdirSync('iam',{recursive:true}); fs.writeFileSync(p, JSON.stringify(o,null,2)); };

r.post('/users/upsert',(req,res)=>{ const o=read(U,{users:{}}); const u=req.body||{}; o.users[u.id]=u; write(U,o); res.json({ ok:true }); });
r.get('/users/:id',(req,res)=>{ const o=read(U,{users:{}}); res.json(o.users[String(req.params.id)]||null); });

r.post('/groups/upsert',(req,res)=>{ const o=read(G,{groups:{}}); const g=req.body||{}; o.groups[g.id]=g; write(G,o); res.json({ ok:true }); });

export default r;
