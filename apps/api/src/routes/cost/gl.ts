import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='data/cost/gl_exports.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/cost',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); };
const read=()=> fs.existsSync(FILE)? fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
r.post('/gl/export',(req,res)=>{
  const period=String(req.body?.period||new Date().toISOString().slice(0,7));
  const gl={ period, entries:[{account:process.env.COST_GL_COGS||'5000',dr:1000,cr:0},{account:process.env.COST_GL_INV||'1400',dr:0,cr:1000}] };
  append({ ts:Date.now(), ...gl }); res.json({ ok:true, gl });
});
r.get('/gl/recent',(_req,res)=>{ res.json({ items: read().reverse().slice(0,50) }); });
export default r;
