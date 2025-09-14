import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='cons/coa_map.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ mappings:[] };
const write=(o:any)=>{ fs.mkdirSync('cons',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };

r.post('/coa/map/set',(req,res)=>{ write({ mappings: req.body?.mappings||[] }); res.json({ ok:true }); });

export default r;
