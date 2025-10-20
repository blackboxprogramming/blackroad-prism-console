import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='mdm/xref.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ xref:{} };
r.get('/xref/lookup',(req,res)=>{ const d=String(req.query.domain||''), s=String(req.query.source||''), id=String(req.query.id||''); const key=`${d}:${s}:${id}`; res.json({ goldenId: read().xref[key]||null }); });
export default r;
