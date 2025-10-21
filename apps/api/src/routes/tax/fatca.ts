import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='tax/fatca.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ profiles:{} };
const write=(o:any)=>{ fs.mkdirSync('tax',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };

r.post('/fatca/profile',(req,res)=>{ const { payeeId, ...rest } = req.body||{}; const o=read(); o.profiles[payeeId]=rest; write(o); res.json({ok:true}); });
r.get('/fatca/review',(req,res)=>{ res.json(read()); });

export default r;
