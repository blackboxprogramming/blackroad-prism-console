import { Router } from 'express';
import fs from 'fs';
const r = Router();
const FILE='data/hr/org.json';
const read=()=>fs.existsSync(FILE)?JSON.parse(fs.readFileSync(FILE,'utf-8')):[];
const write=(arr:any)=>{ fs.mkdirSync('data/hr',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(arr,null,2)); };

r.post('/org/upsert',(req,res)=>{ const {id,email,name,title,managerId,location,status}=req.body||{}; const arr=read().filter((x:any)=>x.id!==id&&x.email!==email); const row={ id:id||email, email,name,title,managerId:managerId||null,location:location||'',status:status||'active'}; arr.push(row); write(arr); res.json({ok:true}); });

function tree(arr:any[], managerId:any=null){ return arr.filter(x=>String(x.managerId||'')===String(managerId||'')).map(n=>({...n, reports: tree(arr,n.id)})); }

r.get('/org/flat',(_req,res)=>res.json({items:read()}));
r.get('/org/tree',(_req,res)=>{ const arr=read(); res.json({ tree: tree(arr,null) }); });

export default r;
